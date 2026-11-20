import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { fileTypeFromBuffer } from "file-type";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Cleanup, transaction } from "./models.js";
import { fail } from "./core.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
    fields: 20,
    fieldSize: 100000,
  },
  fileFilter(req, file, cb) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
      return cb(
        Object.assign(new Error("Chỉ nhận JPG, PNG, WebP"), { status: 400, field: file.fieldname }),
      );
    cb(null, true);
  },
});
export const postUpload = upload.array("images", 6),
  avatarUpload = upload.single("avatar");
function configure() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  )
    fail(503, "Chưa cấu hình Cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
export async function uploadImages(files = [], protectedMedia = false) {
  const results = [];
  try {
    for (const file of files) {
      const type = await fileTypeFromBuffer(file.buffer);
      if (
        !type ||
        !["image/jpeg", "image/png", "image/webp"].includes(type.mime)
      )
        fail(400, "Chỉ nhận ảnh JPG, PNG, WebP thật", file.fieldname);
      configure();
      const result = await new Promise((resolve, reject) =>
        cloudinary.uploader
          .upload_stream(
            { folder: "travel-diary", resource_type: "image", type: protectedMedia ? "authenticated" : "upload" },
            (err, r) => (err ? reject(err) : resolve(r)),
          )
          .end(file.buffer),
      );
      results.push({
        url: result.secure_url,
        publicId: result.public_id,
        ...(protectedMedia ? { protectedId: result.public_id } : {}),
        width: result.width,
        height: result.height,
      });
    }
    return results;
  } catch (e) {
    await enqueue(results);
    throw e;
  }
}
export async function enqueue(images, session) {
  for (const image of images || [])
    if (image?.publicId)
      await Cleanup.updateOne(
        { publicId: image.protectedId || image.publicId },
        { $setOnInsert: { attempts: 0, delivery: image.protectedId ? "authenticated" : "upload" } },
        { upsert: true, session },
      );
}
export async function cleanupImages() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  configure();
  for (const job of await Cleanup.find().limit(20)) {
    try {
      const removed = await cloudinary.uploader.destroy(job.publicId, { type:job.delivery || "upload", invalidate:true });
      if (!["ok", "not found"].includes(removed.result)) throw Error("Cloudinary cleanup pending");
      await job.deleteOne();
    } catch {
      await Cleanup.updateOne({ _id: job._id }, { $inc: { attempts: 1 } });
    }
  }
}

// Only migrate original uploads belonging to this Cloudinary environment.
export function managedImage(image) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud || !image.publicId?.startsWith("travel-diary/")) return false;
  try {
    const url = new URL(image.url);
    return url.origin === "https://res.cloudinary.com" && url.pathname.startsWith("/"+cloud+"/image/upload/");
  } catch { return false; }
}
export async function protectExisting(model, id, images) {
  for (const image of images.filter(i=>!i.protectedId && managedImage(i))) {
    configure();
    const copy = await cloudinary.uploader.upload(image.url, {folder:"travel-diary", type:"authenticated", resource_type:"image"});
    const replacement = {publicId:image.publicId, protectedId:copy.public_id, url:copy.secure_url, width:copy.width, height:copy.height};
    try {
      await transaction(async session=>{
        const result = await model.updateOne({_id:id,images:{$elemMatch:{publicId:image.publicId,protectedId:{$exists:false}}}},
          {$set:{"images.$":replacement}}, {session});
        await enqueue([result.modifiedCount ? image : replacement],session);
      });
    } catch (error) { await enqueue([replacement]); throw error; }
  }
}
export function imageLinks(images, route) {
  return images.map(i=>({publicId:i.publicId,width:i.width,height:i.height,
    url:i.protectedId ? route+"?id="+encodeURIComponent(i.publicId) : i.url}));
}
export async function sendImage(images, req, res) {
  const image=images.find(i=>i.publicId===req.query.id && i.protectedId);
  if (!image) fail(404,"Không tìm thấy ảnh");
  configure();
  const signed=cloudinary.url(image.protectedId,{resource_type:"image",type:"authenticated",secure:true,sign_url:true});
  const upstream=await fetch(signed,{signal:AbortSignal.timeout(30000)});
  if (!upstream.ok || !upstream.headers.get("content-type")?.startsWith("image/")) {
    await upstream.body?.cancel();
    fail(502,"Chưa lấy được ảnh");
  }
  res.set({"Content-Type":upstream.headers.get("content-type"),"Cache-Control":"private, no-store"});
  await pipeline(Readable.fromWeb(upstream.body),res);
}

const migrationCursor = new Map();
export async function protectNextBatch(model, filter) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  const after = migrationCursor.get(model);
  const records = await model.find({...filter,...(after ? {_id:{$gt:after}} : {}),
    images:{$elemMatch:{publicId:/^travel-diary\//,protectedId:{$exists:false}}}
  }).select("images").sort({_id:1}).limit(2).lean();
  for (const record of records) {
    migrationCursor.set(model,record._id);
    await protectExisting(model,record._id,record.images);
  }
  if (records.length < 2) migrationCursor.delete(model);
}

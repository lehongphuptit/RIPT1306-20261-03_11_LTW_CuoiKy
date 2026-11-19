import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { fileTypeFromBuffer } from "file-type";
import { Cleanup } from "./models.js";
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
        Object.assign(new Error("Chỉ nhận JPG, PNG, WebP"), { status: 400 }),
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
export async function uploadImages(files = []) {
  const results = [];
  try {
    for (const file of files) {
      const type = await fileTypeFromBuffer(file.buffer);
      if (
        !type ||
        !["image/jpeg", "image/png", "image/webp"].includes(type.mime)
      )
        fail(400, "Chỉ nhận ảnh JPG, PNG, WebP thật");
      configure();
      const result = await new Promise((resolve, reject) =>
        cloudinary.uploader
          .upload_stream(
            { folder: "travel-diary", resource_type: "image" },
            (err, r) => (err ? reject(err) : resolve(r)),
          )
          .end(file.buffer),
      );
      results.push({
        url: result.secure_url,
        publicId: result.public_id,
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
        { publicId: image.publicId },
        { $setOnInsert: { attempts: 0 } },
        { upsert: true, session },
      );
}
export async function cleanupImages() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  configure();
  for (const job of await Cleanup.find().limit(20)) {
    try {
      await cloudinary.uploader.destroy(job.publicId);
      await job.deleteOne();
    } catch {
      await Cleanup.updateOne({ _id: job._id }, { $inc: { attempts: 1 } });
    }
  }
}

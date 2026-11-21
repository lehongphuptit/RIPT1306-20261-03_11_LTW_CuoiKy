import { Router } from "express";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { member, oid, fail } from "./core.js";
import { transaction } from "./models.js";
import { postUpload, uploadImages, enqueue, protectExisting, sendImage, imageLinks } from "./media.js";

export const Draft = mongoose.model("JournalDraft", new mongoose.Schema({
  _id: String,
  revision: String,
  fields: mongoose.Schema.Types.Mixed,
  images: [{ _id: false, publicId: String, protectedId: String, url: String, width: Number, height: Number }],
}));
const ids = z.array(z.string().max(250)).max(6);
const fields = z.object({
  title: z.string().max(120), content: z.string().max(5000),
  location: z.string().max(120), tripDate: z.string().max(10),
  cost: z.string().max(32), visibility: z.enum(["public", "followers", "private"]), keep: ids,
});
const stale = () => fail(409, "Bản nháp đã thay đổi trên thiết bị khác.");
function draftId(req, slot) {
  return req.user._id + ":" + (slot === "new" ? slot : oid(slot));
}
function json(value) {
  try { return JSON.parse(value); } catch { fail(400, "Dữ liệu nháp không hợp lệ"); }
}
// Compare and replace inside the caller's transaction, including image cleanup.
async function replace(req, slot, nextFields, uploads, session, publish = false) {
  const _id = draftId(req, slot);
  const revision = z.string().uuid().parse(req.body.draftRevision);
  const old = await Draft.findOne({ _id, revision }).session(session).lean();
  if (!old) stale();
  const retainedIds = ids.parse(json(req.body.draftImageIds || "[]"));
  const retained = old.images.filter(i => retainedIds.includes(i.publicId));
  if (retained.length !== retainedIds.length) fail(400, "Ảnh không thuộc bản nháp");
  const images = [...retained, ...uploads];
  if (images.length + (nextFields?.keep.length || 0) > 6) fail(400, "Tối đa 6 ảnh");
  const next = { fields: nextFields, images: publish ? [] : images, revision: randomUUID() };
  const result = await Draft.updateOne({ _id, revision }, { $set: next }, { session });
  if (!result.matchedCount) stale();
  await enqueue(old.images.filter(i => !retainedIds.includes(i.publicId)), session);
  return { next, images };
}
export async function publicationImages(req, slot, uploads, session) {
  if (req.body.draftRevision === undefined) return uploads;
  return (await replace(req, slot, null, uploads, session, true)).images;
}
export const drafts = Router();
drafts.get("/me/drafts/:slot", member, async (req, res) => {
  const _id = draftId(req, req.params.slot);
  let draft = await Draft.findOneAndUpdate({ _id }, {
    $setOnInsert: { revision: randomUUID(), fields: null, images: [] },
  }, { upsert: true, new: true }).lean();
  if (draft.images.some(i=>!i.protectedId)) {
    await protectExisting(Draft,_id,draft.images);
    draft = await Draft.findById(_id).lean();
  }
  res.set("Cache-Control", "no-store").json({...draft,images:imageLinks(draft.images,req.path+"/image")});
});
drafts.get("/me/drafts/:slot/image", member, async(req,res)=>{
  const draft=await Draft.findById(draftId(req,req.params.slot)).lean();
  await sendImage(draft?.images || [],req,res);
});
drafts.put("/me/drafts/:slot", member, postUpload, async (req, res) => {
  const nextFields = fields.parse(json(req.body.fields));
  const uploads = await uploadImages(req.files,true);
  let result;
  try {
    await transaction(async session => {
      result = await replace(req, req.params.slot, nextFields, uploads, session);
    });
  } catch (error) {
    await enqueue(uploads);
    throw error;
  }
  res.json({...result.next,images:imageLinks(result.next.images,req.path+"/image")});
});
drafts.delete("/me/drafts/:slot", member, async (req, res) => {
  req.body.draftImageIds = "[]";
  let result;
  await transaction(async session => {
    result = await replace(req, req.params.slot, null, [], session);
  });
  res.json(result.next);
});

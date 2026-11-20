import { Router } from "express";
import { z } from "zod";
import {
  Post,
  User,
  Follow,
  Like,
  Comment,
  Report,
  Notification,
  transaction,
  normalize,
} from "./models.js";
import {
  fail,
  parse,
  member,
  oid,
  same,
  getPost,
  own,
  notify,
  visibleFilter,
  publicFields,
  pagination,
  page,
} from "./core.js";
import { postUpload, uploadImages, enqueue } from "./media.js";
export const posts = Router();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v &&
      v <=
        new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
        }),
    "Ngày đi không hợp lệ hoặc ở tương lai",
  );
const location = z
  .object({
    name: z.string().trim().min(1).max(120),
    placeId: z.string().max(200).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (v) => (v.lat === undefined) === (v.lng === undefined),
    "Cần cả lat và lng",
  );
const body = z.object({
  title: z.string().trim().min(5).max(120),
  content: z.string().trim().min(1).max(5000),
  location,
  tripDate: date,
  cost: z.coerce.number().finite().min(0).max(999999999999),
  visibility: z.enum(["public", "followers"]).default("public"),
});
function input(req, partial = false) {
  const raw = { ...req.body };
  for (const key of ["location", "keepImageIds"])
    if (typeof raw[key] === "string") {
      try {
        raw[key] = JSON.parse(raw[key]);
      } catch {
        fail(400, key + " phải là JSON");
      }
    }
  const values = parse(partial ? body.partial() : body, raw);
  if (values.location)
    values.location.nameKey = normalize(values.location.name);
  if (values.content !== undefined)
    values.hashtags = [
      ...new Set(
        (values.content.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) =>
          t.slice(1).toLowerCase(),
        ),
      ),
    ];
  return {
    values,
    keep:
      raw.keepImageIds === undefined
        ? undefined
        : parse(z.array(z.string()).max(6), raw.keepImageIds),
  };
}
async function decorate(list, u) {
  const ids = list.map((p) => p._id);
  const locked = await User.find({ locked: true }).distinct("_id");
  const [likes, comments, mine] = await Promise.all([
    Like.aggregate([
      { $match: { post: { $in: ids } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { post: { $in: ids }, author: { $nin: locked } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]),
    u ? Like.find({ post: { $in: ids }, user: u._id }) : [],
  ]);
  return list.map((p) => ({
    ...p.toObject({transform: (_doc, value) => { delete value.savedBy; return value; }}),
    saved: !!u && (p.savedBy || []).some(id => same(id,u._id)),
    likeCount: likes.find((l) => same(l._id, p._id))?.count || 0,
    commentCount: comments.find((l) => same(l._id, p._id))?.count || 0,
    liked: mine.some((l) => same(l.post, p._id)),
  }));
}
async function list(req, res, feed = false) {
  const { limit, filter } = pagination(req);
  const filters = [await visibleFilter(req.user), filter];
  if (req.path === "/saved") filters.push({savedBy:req.user._id});
  if (req.query.author) filters.push({ author: oid(req.query.author) });
  if (feed) {
    const followed = await Follow.find({ follower: req.user._id }).distinct(
      "following",
    );
    filters.push({ author: { $in: [req.user._id, ...followed] } });
  }
  const q = String(req.query.q || "")
    .trim()
    .slice(0, 120);
  if (q) {
    const literal = normalize(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.push(
      q.startsWith("#")
        ? { hashtags: q.slice(1).toLowerCase() }
        : { "location.nameKey": { $regex: literal } },
    );
  }
  const items = await Post.find({ $and: filters }).select("+savedBy")
    .populate("author", publicFields)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);
  res.json(page(await decorate(items, req.user), limit));
}
posts.get("/posts", (req, res) => list(req, res));
posts.get("/saved", member, (req,res)=>list(req,res));
posts.get("/feed", member, (req, res) => list(req, res, true));
posts.get("/posts/:id", async (req, res) => {
  const p = await getPost(req.params.id, req.user);
  const saved = req.user && await Post.exists({_id:p._id, savedBy:req.user._id});
  await p.populate("author", publicFields);
  res.json({ post: { ...(await decorate([p], req.user))[0], saved: !!saved } });
});
posts.post("/posts", member, postUpload, async (req, res) => {
  const { values } = input(req);
  const images = await uploadImages(req.files);
  try {
    const p = await Post.create({ ...values, images, author: req.user._id });
    res.status(201).json({ post: p });
  } catch (e) {
    await enqueue(images);
    throw e;
  }
});
posts.patch("/posts/:id", member, postUpload, async (req, res) => {
  own(await getPost(req.params.id, req.user), req.user);
  const { values, keep } = input(req, true);
  const newImages = await uploadImages(req.files);
  let updated;
  try {
    await transaction(async (session) => {
      const p = await getPost(req.params.id, req.user, session, true);
      own(p, req.user);
      const retained =
        keep === undefined
          ? p.images
          : p.images.filter((i) => keep.includes(i.publicId));
      if (keep && retained.length !== new Set(keep).size)
        fail(400, "Ảnh giữ lại không thuộc bài");
      if (retained.length + newImages.length > 6) fail(400, "Tối đa 6 ảnh");
      await enqueue(
        p.images.filter(
          (i) => !retained.some((r) => r.publicId === i.publicId),
        ),
        session,
      );
      Object.assign(p, values);
      p.images = [...retained, ...newImages];
      await p.save({ session });
      updated = p;
    });
  } catch (e) {
    await enqueue(newImages);
    throw e;
  }
  res.json({ post: updated });
});
posts.delete("/posts/:id", member, async (req, res) => {
  await transaction(async (session) => {
    const p = await getPost(req.params.id, req.user, session, true);
    own(p, req.user);
    await enqueue(p.images, session);
    for (const model of [Like, Comment, Notification, Report])
      await model.deleteMany({ post: p._id }).session(session);
    await p.deleteOne({ session });
  });
  res.status(204).end();
});
posts.put("/posts/:id/like", member, async (req, res) => {
  await transaction(async (session) => {
    const p = await getPost(req.params.id, req.user, session, true);
    await Like.updateOne(
      { post: p._id, user: req.user._id },
      { $setOnInsert: { post: p._id, user: req.user._id } },
      { upsert: true, session },
    );
    await notify(p.author, req.user._id, "like", p._id, null, session);
  });
  res.json({ liked: true });
});
posts.delete("/posts/:id/like", member, async (req, res) => {
  await transaction(async (session) => {
    const p = await getPost(req.params.id, req.user, session, true);
    await Like.deleteOne({ post: p._id, user: req.user._id }).session(session);
    await Notification.deleteMany({
      post: p._id,
      actor: req.user._id,
      type: "like",
    }).session(session);
  });
  res.json({ liked: false });
});
for (const [method, operator] of [["put", "$addToSet"], ["delete", "$pull"]]) {
  posts[method]("/posts/:id/save",member,async(req,res)=>{
    await transaction(async session=>{
      const post=await getPost(req.params.id,req.user,session,true);
      await Post.updateOne({_id:post._id},{[operator]:{savedBy:req.user._id}},{session});
    });
    res.json({saved:method==="put"});
  });
  posts[method]("/comments/:id/like",member,async(req,res)=>{
    let count;
    await transaction(async session=>{
      const c=await Comment.findById(oid(req.params.id)).session(session);
      if(!c||await User.exists({_id:c.author,locked:true}).session(session))fail(404,"Không tìm thấy bình luận");
      await getPost(String(c.post),req.user,session,true);
      const updated=await Comment.findByIdAndUpdate(c._id,{[operator]:{likedBy:req.user._id}},{session,new:true}).select("+likedBy");
      count=updated.likedBy.length;
    });
    res.json({liked:method==="put",likeCount:count});
  });
}
posts.get("/posts/:id/comments", async (req, res) => {
  const p = await getPost(req.params.id, req.user);
  const { limit, filter } = pagination(req);
  const locked = await User.find({ locked: true }).distinct("_id");
  const items = await Comment.find({
    $and: [{ post: p._id, author: { $nin: locked } }, filter],
  }).select("+likedBy")
    .populate("author", publicFields)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);
  res.json(page(items.map(c=>{const value=c.toObject();delete value.likedBy;return {...value, likeCount:(c.likedBy||[]).length,liked:!!req.user&&(c.likedBy||[]).some(id=>same(id,req.user._id))};}), limit));
});
posts.post("/posts/:id/comments", member, async (req, res) => {
  const b = parse(
    z.object({
      content: z.string().trim().min(1).max(1000),
      parentId: z.string().optional(),
    }),
    req.body,
  );
  let result;
  await transaction(async (session) => {
    const p = await getPost(req.params.id, req.user, session, true);
    let parent = null;
    if (b.parentId) {
      const c = await Comment.findOne({
        _id: oid(b.parentId),
        post: p._id,
      }).session(session);
      if (!c) fail(400, "Bình luận gốc không tồn tại");
      parent = c.parent || c._id;
    }
    [result] = await Comment.create(
      [{ post: p._id, author: req.user._id, parent, content: b.content }],
      { session },
    );
    await notify(p.author, req.user._id, "comment", p._id, result._id, session);
  });
  res.status(201).json({ comment: result });
});
posts.delete("/comments/:id", member, async (req, res) => {
  await transaction(async (session) => {
    const c = await Comment.findById(oid(req.params.id)).session(session);
    if (!c) fail(404, "Không tìm thấy bình luận");
    const p = await getPost(String(c.post), req.user, session, true);
    if (!same(c.author, req.user._id) && !same(p.author, req.user._id))
      fail(403, "Không có quyền xóa bình luận");
    const ids = await Comment.find({ $or: [{ _id: c._id }, { parent: c._id }] })
      .session(session)
      .distinct("_id");
    await Notification.deleteMany({ comment: { $in: ids } }).session(session);
    await Comment.deleteMany({ _id: { $in: ids } }).session(session);
  });
  res.status(204).end();
});
posts.post("/posts/:id/reports", member, async (req, res) => {
  const b = parse(
    z.object({
      reason: z.enum(["spam", "offensive", "false_info", "other"]),
      note: z.string().trim().max(500).default(""),
    }),
    req.body,
  );
  await transaction(async (session) => {
    const p = await getPost(req.params.id, req.user, session, true);
    if (same(p.author, req.user._id))
      fail(400, "Không báo cáo bài của chính mình");
    await Report.create([{ ...b, post: p._id, reporter: req.user._id }], {
      session,
    });
  });
  res.status(201).json({ message: "Đã gửi báo cáo" });
});

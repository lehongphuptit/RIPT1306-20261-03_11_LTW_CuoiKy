import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  User,
  Post,
  Follow,
  Notification,
  transaction,
  normalize,
} from "./models.js";
import {
  fail,
  parse,
  registration,
  credentials,
  password,
  issue,
  pub,
  required,
  member,
  publicFields,
  oid,
  same,
  notify,
  visibleFilter,
  pagination,
  page,
} from "./core.js";
import { avatarUpload, uploadImages, enqueue } from "./media.js";
export const accounts = Router();
const limiter = rateLimit({
  windowMs: 60000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { message: "Thử lại sau một phút" } },
});
accounts.post("/auth/register", limiter, async (req, res) => {
  const b = parse(registration, req.body);
  const u = await User.create({
    ...b,
    password: undefined,
    passwordHash: await bcrypt.hash(b.password, 12),
    searchKey: normalize(b.displayName + " " + b.username),
    role: "member",
  });
  res.status(201).json({ user: pub(u), token: issue(u) });
});
async function login(req, res, adminOnly = false) {
  const b = parse(credentials, req.body);
  const u = await User.findOne({ email: b.email }).select("+passwordHash");
  if (!u || !(await bcrypt.compare(b.password, u.passwordHash)))
    fail(401, "Email hoặc mật khẩu không đúng");
  if (u.locked) fail(403, "Tài khoản đã bị khóa");
  if (adminOnly && u.role !== "admin") fail(403, "Cần tài khoản quản trị");
  res.json({ user: pub(u), token: issue(u) });
}
accounts.post("/auth/login", limiter, (req, res) => login(req, res));
accounts.post("/auth/admin/login", limiter, (req, res) =>
  login(req, res, true),
);
accounts.get("/auth/me", required, (req, res) =>
  res.json({ user: pub(req.user) }),
);
accounts.post("/auth/logout", required, async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  res.status(204).end();
});
accounts.patch("/auth/password", required, async (req, res) => {
  const b = parse(
    z.object({ currentPassword: z.string().min(1), newPassword: password }),
    req.body,
  );
  const u = await User.findById(req.user._id).select("+passwordHash");
  if (!(await bcrypt.compare(b.currentPassword, u.passwordHash)))
    fail(400, "Mật khẩu hiện tại không đúng");
  await User.updateOne(
    { _id: u._id },
    {
      $set: { passwordHash: await bcrypt.hash(b.newPassword, 12) },
      $inc: { tokenVersion: 1 },
    },
  );
  res.json({ message: "Đã đổi mật khẩu. Vui lòng đăng nhập lại." });
});
accounts.patch("/users/me", required, avatarUpload, async (req, res) => {
  const b = parse(
    z.object({
      displayName: z.string().trim().min(1).max(80).optional(),
      bio: z.string().trim().max(200).optional(),
    }),
    req.body,
  );
  const images = await uploadImages(req.file ? [req.file] : []);
  try {
    await transaction(async (session) => {
      const u = await User.findById(req.user._id).session(session);
      if (images.length) {
        await enqueue([u.avatar], session);
        u.avatar = images[0];
      }
      Object.assign(u, b);
      u.searchKey = normalize(u.displayName + " " + u.username);
      await u.save({ session });
    });
  } catch (e) {
    await enqueue(images);
    throw e;
  }
  res.json({ user: pub(await User.findById(req.user._id)) });
});
accounts.get("/users", async (req, res) => {
  const { limit, filter } = pagination(req);
  const q = String(req.query.q || "").slice(0, 80);
  const literal = normalize(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const list = await User.find({
    $and: [
      { role: "member", locked: false, searchKey: { $regex: literal } },
      filter,
    ],
  })
    .select(publicFields + " createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);
  res.json(page(list, limit));
});
accounts.get("/users/:id", async (req, res) => {
  const u = await User.findOne({
    _id: oid(req.params.id),
    locked: false,
    role: "member",
  }).select(publicFields);
  if (!u) fail(404, "Không tìm thấy thành viên");
  const [followers, following, posts, isFollowing] = await Promise.all([
    Follow.countDocuments({ following: u._id }),
    Follow.countDocuments({ follower: u._id }),
    Post.countDocuments({
      $and: [{ author: u._id }, await visibleFilter(req.user)],
    }),
    req.user
      ? Follow.exists({ follower: req.user._id, following: u._id })
      : false,
  ]);
  res.json({
    user: u,
    followers,
    following,
    posts,
    isFollowing: !!isFollowing,
  });
});
accounts.put("/users/:id/follow", member, async (req, res) => {
  const id = oid(req.params.id);
  if (same(id, req.user._id)) fail(400, "Không thể tự theo dõi");
  await transaction(async (session) => {
    const target = await User.findOneAndUpdate(
      { _id: id, role: "member", locked: false },
      { $inc: { __followRevision: 1 } },
      { session, strict: false },
    );
    if (!target) fail(404, "Không tìm thấy thành viên");
    await Follow.updateOne(
      { follower: req.user._id, following: id },
      { $setOnInsert: { follower: req.user._id, following: id } },
      { upsert: true, session },
    );
    await notify(id, req.user._id, "follow", null, null, session);
  });
  res.json({ following: true });
});
accounts.delete("/users/:id/follow", member, async (req, res) => {
  await transaction(async (session) => {
    await Follow.deleteOne({
      follower: req.user._id,
      following: oid(req.params.id),
    }).session(session);
    await Notification.deleteMany({
      recipient: req.params.id,
      actor: req.user._id,
      type: "follow",
    }).session(session);
  });
  res.json({ following: false });
});
accounts.get("/notifications/unread-count", required, async (req, res) =>
  res.json({
    count: await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    }),
  }),
);
accounts.get("/notifications", required, async (req, res) => {
  const { limit, filter } = pagination(req);
  res.json(
    page(
      await Notification.find({ $and: [{ recipient: req.user._id }, filter] })
        .populate("actor", publicFields)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1),
      limit,
    ),
  );
});
accounts.patch("/notifications/read-all", required, async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } },
  );
  res.status(204).end();
});
accounts.patch("/notifications/:id/read", required, async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: oid(req.params.id), recipient: req.user._id },
    { $set: { read: true } },
    { new: true },
  );
  if (!n) fail(404, "Không tìm thấy thông báo");
  res.json({ notification: n });
});

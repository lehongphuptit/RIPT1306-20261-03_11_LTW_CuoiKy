import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";
import { User, Post, Follow, Notification } from "./models.js";
export const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export const oid = (id) => {
  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id))
    fail(400, "ID không hợp lệ");
  return id;
};
export const same = (a, b) => String(a) === String(b);
export const pub = (u) => ({
  _id: u._id,
  email: u.email,
  username: u.username,
  displayName: u.displayName,
  bio: u.bio,
  avatar: u.avatar,
  role: u.role,
  locked: u.locked,
  isOwner: u.isOwner,
});
export const publicFields = "username displayName bio avatar";
export const parse = (schema, value) => schema.parse(value);
export const password = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/)
  .regex(/[0-9]/)
  .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Mật khẩu tối đa 72 byte");
export const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});
export const registration = credentials.extend({
  password,
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/),
  displayName: z.string().trim().min(1).max(80),
});
export function issue(u) {
  return jwt.sign(
    { sub: String(u._id), v: u.tokenVersion },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
      issuer: "travel-diary",
      audience: "travel-diary-web",
      algorithm: "HS256",
    },
  );
}
export async function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return next();
  if (!h.startsWith("Bearer ")) fail(401, "Token không hợp lệ");
  let payload;
  try {
    payload = jwt.verify(h.slice(7), process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "travel-diary",
      audience: "travel-diary-web",
    });
  } catch {
    fail(401, "Phiên đăng nhập hết hạn");
  }
  if (!mongoose.isObjectIdOrHexString(payload.sub))
    fail(401, "Token không hợp lệ");
  const u = await User.findById(payload.sub);
  if (!u || u.tokenVersion !== payload.v) fail(401, "Vui lòng đăng nhập lại");
  if (u.locked) fail(403, "Tài khoản đã bị khóa");
  req.user = u;
  next();
}
export function required(req, res, next) {
  if (!req.user) fail(401, "Bạn cần đăng nhập");
  next();
}
export function member(req, res, next) {
  if (!req.user) fail(401, "Bạn cần đăng nhập");
  if (req.user.role !== "member") fail(403, "Chức năng dành cho thành viên");
  next();
}
export function admin(req, res, next) {
  if (!req.user) fail(401, "Bạn cần đăng nhập");
  if (req.user.role !== "admin") fail(403, "Bạn không có quyền quản trị");
  next();
}
export async function visibleFilter(u, session) {
  if (u?.role === "admin") return {};
  const locked = await User.find({ locked: true })
    .select("_id")
    .session(session || null);
  const followed = u
    ? await Follow.find({ follower: u._id })
        .session(session || null)
        .distinct("following")
    : [];
  return {
    author: { $nin: locked.map((v) => v._id) },
    $or: [
      ...(u ? [{ author: u._id }] : []),
      {
        status: "active",
        $or: [
          { visibility: "public" },
          ...(u
            ? [{ visibility: "followers", author: { $in: followed } }]
            : []),
        ],
      },
    ],
  };
}
export async function getPost(id, u, session, write = false) {
  oid(id);
  if (write)
    await Post.updateOne({ _id: id }, { $inc: { revision: 1 } }, { session });
  const p = await Post.findOne({
    $and: [{ _id: id }, await visibleFilter(u, session)],
  }).session(session || null);
  if (!p) fail(404, "Không tìm thấy bài viết");
  return p;
}
export function own(p, u) {
  if (!same(p.author, u._id)) fail(403, "Bạn không phải chủ bài viết");
}
export async function notify(
  recipient,
  actor,
  type,
  post = null,
  comment = null,
  session,
) {
  if (same(recipient, actor)) return;
  await Notification.updateOne(
    { recipient, actor, type, post, comment },
    { $set: { read: false, updatedAt: new Date() } },
    { upsert: true, session },
  );
}
export function pagination(req) {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  let filter = {};
  if (req.query.cursor) {
    try {
      const c = JSON.parse(
        Buffer.from(req.query.cursor, "base64url").toString(),
      );
      oid(c.id);
      if (!Number.isFinite(Date.parse(c.date))) throw Error();
      filter = {
        $or: [
          { createdAt: { $lt: new Date(c.date) } },
          { createdAt: new Date(c.date), _id: { $lt: c.id } },
        ],
      };
    } catch {
      fail(400, "Cursor không hợp lệ");
    }
  }
  return { limit, filter };
}
export function page(items, limit) {
  const hasMore = items.length > limit;
  const data = items.slice(0, limit);
  const last = data.at(-1);
  return {
    data,
    nextCursor: hasMore
      ? Buffer.from(
          JSON.stringify({ id: last._id, date: last.createdAt }),
        ).toString("base64url")
      : null,
  };
}

import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, Post, Report, transaction, normalize } from "./models.js";
import {
  admin,
  fail,
  oid,
  same,
  pub,
  parse,
  registration,
  password,
  pagination,
  page,
} from "./core.js";
export const management = Router();
management.use("/admin", admin);
management.get("/admin/users", async (req, res) => {
  const { limit, filter } = pagination(req);
  res.json(
    page(
      await User.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .select("-tokenVersion"),
      limit,
    ),
  );
});
management.post("/admin/users", async (req, res) => {
  const b = parse(
    registration.extend({
      role: z.enum(["member", "admin"]).default("member"),
    }),
    req.body,
  );
  if (b.role === "admin" && !req.user.isOwner)
    fail(403, "Chỉ admin gốc được tạo admin");
  const u = await User.create({
    ...b,
    password: undefined,
    passwordHash: await bcrypt.hash(b.password, 12),
    searchKey: normalize(b.displayName + " " + b.username),
  });
  res.status(201).json({ user: pub(u) });
});
management.patch("/admin/users/:id", async (req, res) => {
  const b = parse(
    z.object({
      locked: z.boolean().optional(),
      role: z.enum(["member", "admin"]).optional(),
    }),
    req.body,
  );
  const id = oid(req.params.id);
  if (same(id, req.user._id)) fail(400, "Không tự khóa hoặc đổi vai trò");
  await transaction(async (session) => {
    const u = await User.findById(id).session(session);
    if (!u) fail(404, "Không tìm thấy tài khoản");
    if (u.isOwner) fail(403, "Không được thay đổi admin gốc");
    if ((b.role !== undefined || u.role === "admin") && !req.user.isOwner)
      fail(403, "Chỉ admin gốc được quản lý admin và vai trò");
    Object.assign(u, b);
    u.tokenVersion++;
    await u.save({ session });
  });
  res.json({ user: pub(await User.findById(id)) });
});
management.patch("/admin/users/:id/password", async (req, res) => {
  const b = parse(z.object({ newPassword: password }), req.body);
  const u = await User.findById(oid(req.params.id));
  if (!u) fail(404, "Không tìm thấy tài khoản");
  if (
    u.isOwner ||
    same(u._id, req.user._id) ||
    (u.role === "admin" && !req.user.isOwner)
  )
    fail(403, "Không được đặt lại mật khẩu tài khoản này");
  u.passwordHash = await bcrypt.hash(b.newPassword, 12);
  u.tokenVersion++;
  await u.save();
  res.json({ message: "Đã đặt lại mật khẩu và thu hồi phiên cũ" });
});
management.get("/admin/reports", async (req, res) => {
  const { limit, filter } = pagination(req);
  const status = req.query.status
    ? parse(z.enum(["pending", "resolved", "rejected"]), req.query.status)
    : "pending";
  res.json(
    page(
      await Report.find({ $and: [{ status }, filter] })
        .populate("reporter", "username displayName")
        .populate("post", "title status")
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1),
      limit,
    ),
  );
});
management.patch("/admin/reports/:id", async (req, res) => {
  const { action } = parse(
    z.object({ action: z.enum(["hide", "dismiss"]) }),
    req.body,
  );
  await transaction(async (session) => {
    const r = await Report.findById(oid(req.params.id)).session(session);
    if (!r) fail(404, "Không tìm thấy báo cáo");
    const p = await Post.findOneAndUpdate(
      { _id: r.post },
      {
        $inc: { revision: 1 },
        ...(action === "hide" ? { $set: { status: "hidden" } } : {}),
      },
      { session },
    );
    if (!p) fail(404, "Bài đã bị xóa");
    await Report.updateMany(
      { post: r.post, status: "pending" },
      {
        $set: {
          status: action === "hide" ? "resolved" : "rejected",
          handledBy: req.user._id,
          handledAt: new Date(),
        },
      },
      { session },
    );
  });
  res.json({ message: "Đã xử lý các báo cáo đang chờ của bài" });
});
management.patch("/admin/posts/:id/status", async (req, res) => {
  const b = parse(z.object({ status: z.enum(["active", "hidden"]) }), req.body);
  await transaction(async (session) => {
    const p = await Post.findOneAndUpdate(
      { _id: oid(req.params.id) },
      { $set: b, $inc: { revision: 1 } },
      { session },
    );
    if (!p) fail(404, "Không tìm thấy bài");
    if (b.status === "hidden")
      await Report.updateMany(
        { post: p._id, status: "pending" },
        {
          $set: {
            status: "resolved",
            handledBy: req.user._id,
            handledAt: new Date(),
          },
        },
        { session },
      );
  });
  res.json({ message: "Đã cập nhật trạng thái bài" });
});
management.get("/admin/stats", async (req, res) => {
  const locked = await User.find({ locked: true }).distinct("_id");
  const [users, posts, pendingReports, locations] = await Promise.all([
    User.countDocuments({ role: "member" }),
    Post.countDocuments(),
    Report.countDocuments({ status: "pending" }),
    Post.aggregate([
      { $match: { status: "active", author: { $nin: locked } } },
      {
        $group: {
          _id: {
            $cond: [
              {
                $and: [
                  { $ne: ["$location.placeId", null] },
                  { $ne: ["$location.placeId", ""] },
                ],
              },
              { $concat: ["place:", { $ifNull: ["$location.placeId", ""] }] },
              { $concat: ["name:", "$location.nameKey"] },
            ],
          },
          name: { $first: "$location.name" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]),
  ]);
  res.json({ users, posts, pendingReports, locations });
});

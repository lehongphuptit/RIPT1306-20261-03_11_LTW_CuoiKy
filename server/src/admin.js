import { randomUUID } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, Post, Appeal, Notification, Report, CommentReport, removeCommentThread, transaction, normalize } from "./models.js";
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
      await User.find(req.query.username === undefined ? filter : {
        ...filter, username: parse(z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),req.query.username),
      })
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
      (await (req.query.target === "comment" ? CommentReport : Report).find({ $and: [{ status }, filter] })
        .populate("reporter", "username displayName")
        .populate({path:"post",select:"title status",match:{visibility:{$ne:"private"}}})
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1).lean()).map(r=>r.post ? r : {...r,originalContent:undefined,note:undefined}),
      limit,
    ),
  );
});
management.patch("/admin/comment-reports/:id",async(req,res)=>{
  const {action}=parse(z.object({action:z.enum(["remove","dismiss"])}),req.body);
  await transaction(async session=>{
    const report=await CommentReport.findOneAndUpdate({_id:oid(req.params.id),status:"pending"},
      {$set:{status:action==="remove"?"resolved":"rejected",handledBy:req.user._id,handledAt:new Date()}},{session,new:true});
    if(!report) fail(409,"Báo cáo đã được xử lý hoặc không tồn tại");
    if(action==="remove") {
      const result=await Post.updateOne({_id:report.post,visibility:{$ne:"private"}},{$inc:{revision:1}},{session});
      if(!result.matchedCount)fail(404,"Bài viết không còn hiển thị");
      await removeCommentThread(report.comment,session);
    }
  });
  res.json({message:"Đã xử lý báo cáo bình luận"});
});
async function decisionNotice(recipient,actor,type,post,message,session){
  // Reuse the existing notification index; a new decision must surface as unread.
  const now=new Date();
  await Notification.updateOne({recipient,actor,type,post,comment:null},
    {$set:{message,read:false,createdAt:now,updatedAt:now}},
    {upsert:true,session,timestamps:false,overwriteImmutable:true});
}
async function setPostStatus(post,status,actor,session){
  if(post.status===status)return;
  const hiding=status==="hidden";
  post.status=status;
  if(hiding)post.moderationCycle=randomUUID();
  await post.save({session});
  if(hiding){
    await Report.updateMany({post:post._id,status:"pending"},
      {$set:{status:"resolved",handledBy:actor,handledAt:new Date()}},{session});
  }else{
    await Appeal.updateOne({post:post._id,cycle:post.moderationCycle || String(post._id),status:"pending"},
      {$set:{status:"approved",handledBy:actor,handledAt:new Date()}},{session});
  }
  await decisionNotice(post.author,actor,hiding?"post_hidden":"post_restored",post._id,
    hiding?"Bài “"+post.title+"” đã bị ẩn. Mở bài để gửi khiếu nại.":"Bài “"+post.title+"” đã được bỏ ẩn.",session);
}
management.patch("/admin/reports/:id",async(req,res)=>{
  const {action}=parse(z.object({action:z.enum(["hide","dismiss"])}),req.body);
  await transaction(async session=>{
    const report=await Report.findById(oid(req.params.id)).session(session);
    if(!report)fail(404,"Không tìm thấy báo cáo");
    if(report.status!=="pending")fail(409,"Báo cáo đã được xử lý");
    if(action==="hide"){
      const p=await Post.findOne({_id:report.post,visibility:{$ne:"private"}}).session(session);
      if(!p)fail(404,"Bài viết không còn hiển thị");
      await setPostStatus(p,"hidden",req.user._id,session);
    }else{
      await decisionNotice(report.reporter,req.user._id,"report_dismissed",report.post,
        "Quản trị viên đã xem báo cáo của bạn và quyết định không ẩn bài viết theo báo cáo này.",session);
    }
    await Report.updateOne({_id:report._id,status:"pending"},{$set:{
      status:action==="hide"?"resolved":"rejected",handledBy:req.user._id,handledAt:new Date()}},{session});
  });
  res.json({message:"Đã xử lý báo cáo"});
});
management.patch("/admin/posts/:id/status",async(req,res)=>{
  const {status}=parse(z.object({status:z.enum(["active","hidden"])}),req.body);
  await transaction(async session=>{
    const p=await Post.findOne({_id:oid(req.params.id),visibility:{$ne:"private"}}).session(session);
    if(!p)fail(404,"Không tìm thấy bài");
    await setPostStatus(p,status,req.user._id,session);
  });
  res.json({message:"Đã cập nhật trạng thái bài"});
});
management.get("/admin/appeals",async(req,res)=>{
  const {limit,filter}=pagination(req);
  const status=parse(z.enum(["pending","approved","rejected"]).default("pending"),req.query.status);
  const items=await Appeal.find({$and:[{status},filter]}).populate("author","username displayName")
    .populate({path:"post",select:"title status",match:{visibility:{$ne:"private"}}})
    .sort({createdAt:-1,_id:-1}).limit(limit+1);
  res.json(page(items,limit));
});
management.patch("/admin/appeals/:id",async(req,res)=>{
  const {action}=parse(z.object({action:z.enum(["approve","reject"])}),req.body);
  await transaction(async session=>{
    const appeal=await Appeal.findById(oid(req.params.id)).session(session);
    if(!appeal)fail(404,"Không tìm thấy khiếu nại");
    if(appeal.status!=="pending")fail(409,"Khiếu nại đã được xử lý");
    const post=await Post.findById(appeal.post).session(session);
    if(!post || post.status!=="hidden" || appeal.cycle!==(post.moderationCycle || String(post._id)))
      fail(409,"Trạng thái bài viết đã thay đổi");
    if(action==="approve")await setPostStatus(post,"active",req.user._id,session);
    else{
      appeal.status="rejected";appeal.handledBy=req.user._id;appeal.handledAt=new Date();
      await appeal.save({session});
      await decisionNotice(appeal.author,req.user._id,"appeal_denied",post._id,
        "Khiếu nại cho bài “"+post.title+"” đã được xem xét. Bài viết vẫn bị ẩn.",session);
    }
  });
  res.json({message:"Đã xử lý khiếu nại"});
});
management.get("/admin/stats", async (req, res) => {
  const locked = await User.find({ locked: true }).distinct("_id");
  const [users, posts, pendingReports, locations] = await Promise.all([
    User.countDocuments({ role: "member" }),
    Post.countDocuments(),
    Promise.all([Report,CommentReport].map(model=>model.countDocuments({status:"pending"}))).then(([posts,comments])=>posts+comments),
    Post.aggregate([
      { $match: { status: "active", visibility:{$ne:"private"}, author: { $nin: locked } } },
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

import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, extra = {}) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  ...extra,
});
const opts = { timestamps: true, versionKey: false };
export const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
const user = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    searchKey: String,
    bio: { type: String, default: "" },
    avatar: { url: String, publicId: String },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    locked: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    isOwner: { type: Boolean, default: false },
  },
  opts,
);
user.index(
  { isOwner: 1 },
  { unique: true, partialFilterExpression: { isOwner: true } },
);
const image = new Schema(
  { url: String, publicId: String, protectedId: String, width: Number, height: Number },
  { _id: false },
);
const post = new Schema(
  {
    savedBy: { type: [ref("User")], select: false, index: true },
    author: ref("User", { required: true, index: true }),
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: [image],
    location: {
      name: String,
      nameKey: String,
      placeId: String,
      lat: Number,
      lng: Number,
    },
    tripDate: Date,
    cost: Number,
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
    status: { type: String, enum: ["active", "hidden"], default: "active" },
    hashtags: [String],
    revision: { type: Number, default: 0 },
  },
  opts,
);
post.index({ createdAt: -1, _id: -1 });
post.index({ "location.nameKey": 1 });
post.index({ hashtags: 1 });
const comment = new Schema(
  {
    likedBy: { type: [ref("User")], select: false },
    post: ref("Post", { required: true, index: true }),
    author: ref("User", { required: true }),
    parent: ref("Comment", { default: null, index: true }),
    content: { type: String, required: true },
  },
  opts,
);
const like = new Schema(
  {
    post: ref("Post", { required: true, index: true }),
    user: ref("User", { required: true }),
  },
  opts,
);
like.index({ post: 1, user: 1 }, { unique: true });
const follow = new Schema(
  {
    follower: ref("User", { required: true }),
    following: ref("User", { required: true }),
  },
  opts,
);
follow.index({ follower: 1, following: 1 }, { unique: true });
follow.index({ following: 1 });
const notification = new Schema(
  {
    recipient: ref("User", { required: true }),
    actor: ref("User", { required: true }),
    type: { type: String, enum: ["like", "comment", "follow"] },
    post: ref("Post", { default: null }),
    comment: ref("Comment", { default: null }),
    read: { type: Boolean, default: false },
  },
  opts,
);
notification.index(
  { recipient: 1, actor: 1, type: 1, post: 1, comment: 1 },
  { unique: true },
);
notification.index({ recipient: 1, read: 1, createdAt: -1 });
const report = new Schema(
  {
    post: ref("Post", { required: true }),
    reporter: ref("User", { required: true }),
    reason: {
      type: String,
      enum: ["spam", "offensive", "false_info", "other"],
    },
    note: String,
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },
    handledBy: ref("User"),
    handledAt: Date,
  },
  opts,
);
report.index({ post: 1, reporter: 1 }, { unique: true });
report.index({ status: 1, createdAt: -1 });
const commentReport = new Schema({
  ...report.obj, comment: ref("Comment",{required:true}), originalContent: {type:String,required:true}
},opts);
commentReport.index({reporter:1,comment:1},{unique:true});
export const CommentReport = mongoose.model("CommentReport",commentReport);

export async function removeCommentThread(id, session) {
  const ids = await Comment.find({$or:[{_id:id},{parent:id}]}).session(session).distinct("_id");
  await Notification.deleteMany({comment:{$in:ids}}).session(session);
  await Comment.deleteMany({_id:{$in:ids}}).session(session);
  await CommentReport.updateMany({comment:{$in:ids},status:"pending"},{$set:{status:"resolved",handledAt:new Date()}}).session(session);
}
const cleanup = new Schema(
  {
    publicId: { type: String, unique: true },
    delivery: String,
    attempts: { type: Number, default: 0 },
  },
  opts,
);
export const User = mongoose.model("User", user),
  Post = mongoose.model("Post", post),
  Comment = mongoose.model("Comment", comment),
  Like = mongoose.model("Like", like),
  Follow = mongoose.model("Follow", follow),
  Notification = mongoose.model("Notification", notification),
  Report = mongoose.model("Report", report),
  Cleanup = mongoose.model("Cleanup", cleanup);
export async function connect(uri) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}
export const transaction = (fn) => mongoose.connection.transaction(fn);

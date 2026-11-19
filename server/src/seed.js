import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connect, User, Post, normalize } from "./models.js";
import { registration } from "./core.js";
try {
  if (!process.env.MONGO_URI) throw Error("Thiếu MONGO_URI");
  await connect(process.env.MONGO_URI);
  const b = registration.parse({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    username: process.env.ADMIN_USERNAME || "admin",
    displayName: "Quản trị Travel Diary",
  });
  const owner = await User.findOne({ isOwner: true });
  if (!owner) {
    if (
      await User.exists({ $or: [{ email: b.email }, { username: b.username }] })
    )
      throw Error("Email/username admin đã tồn tại; không tự nâng quyền");
    await User.create({
      ...b,
      password: undefined,
      passwordHash: await bcrypt.hash(b.password, 12),
      role: "admin",
      isOwner: true,
      searchKey: normalize(b.displayName + " " + b.username),
    });
    console.log("Đã tạo admin gốc");
  } else console.log("Admin gốc đã tồn tại; giữ nguyên");
  if (process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD) {
    const d = registration.parse({
      email: process.env.DEMO_EMAIL,
      password: process.env.DEMO_PASSWORD,
      username: "travel_demo",
      displayName: "Người đi du lịch",
    });
    let u = await User.findOne({ email: d.email });
    if (!u)
      u = await User.create({
        ...d,
        password: undefined,
        passwordHash: await bcrypt.hash(d.password, 12),
        searchKey: normalize(d.displayName + " " + d.username),
      });
    if (!(await Post.exists({ author: u._id })))
      await Post.create({
        author: u._id,
        title: "Một chiều bình yên ở Hội An",
        content: "Nhật ký đầu tiên của mình. #hoian #vietnam",
        hashtags: ["hoian", "vietnam"],
        location: { name: "Hội An", nameKey: "hoi an" },
        tripDate: new Date("2026-01-01"),
        cost: 500000,
        visibility: "public",
        images: [],
      });
    console.log("Đã chuẩn bị dữ liệu demo");
  }
} catch (e) {
  console.error(
    e.name === "ZodError"
      ? "Kiểm tra ADMIN_EMAIL/ADMIN_PASSWORD (8 ký tự, chữ và số)"
      : e.message,
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

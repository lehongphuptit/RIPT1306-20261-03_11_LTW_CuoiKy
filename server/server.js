import "dotenv/config";
import mongoose from "mongoose";
import { connect } from "./src/models.js";
import { createApp } from "./src/app.js";
import { cleanupImages } from "./src/media.js";
if (
  !process.env.MONGO_URI ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
)
  throw Error(
    "Cần MONGO_URI và JWT_SECRET ngẫu nhiên dài tối thiểu 32 ký tự trong .env",
  );
try {
  await connect(process.env.MONGO_URI);
  const app = createApp();
  const server = app.listen(Number(process.env.PORT) || 5000, "0.0.0.0", () =>
    console.log(
      "Travel Diary API listening on port " + (process.env.PORT || 5000),
    ),
  );
  let cleaning = false;
  const timer = setInterval(async () => {
    if (cleaning) return;
    cleaning = true;
    try {
      await cleanupImages();
    } catch {
      console.error("Image cleanup retry pending");
    } finally {
      cleaning = false;
    }
  }, 60000);
  timer.unref();
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      clearInterval(timer);
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    });
} catch {
  console.error(
    "Không kết nối được MongoDB. Kiểm tra URI, tài khoản DB, IP access list và replica set.",
  );
  process.exitCode = 1;
}

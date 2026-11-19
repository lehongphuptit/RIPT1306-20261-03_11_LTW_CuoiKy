import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { auth } from "./core.js";
import { accounts } from "./accounts.js";
import { posts } from "./posts.js";
import { management } from "./admin.js";
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);
  app.use(helmet());
  const origins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim());
  app.use(
    cors({
      origin(origin, cb) {
        cb(null, !origin || origins.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (req, res) =>
    res
      .status(mongoose.connection.readyState === 1 ? 200 : 503)
      .json({
        status:
          mongoose.connection.readyState === 1 ? "ok" : "database-unavailable",
      }),
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: { message: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      },
    }),
    auth,
    accounts,
    posts,
    management,
  );
  app.use((req, res) =>
    res.status(404).json({ error: { message: "Không tìm thấy API" } }),
  );
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    let status = err.status || 500,
      message = err.message,
      fields;
    if (err instanceof ZodError) {
      status = 400;
      message = "Dữ liệu không hợp lệ";
      fields = err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
    } else if (err.code === 11000) {
      status = 409;
      message = "Dữ liệu đã tồn tại (email, username hoặc thao tác trùng)";
    } else if (
      err.name === "MulterError" ||
      err.name === "CastError" ||
      err.name === "ValidationError"
    ) {
      status = 400;
      message =
        err.name === "MulterError"
          ? "Ảnh tối đa 5 MB/tệp, tối đa 6 tệp"
          : err.message;
    }
    if (status >= 500) {
      console.error("Request failed:", err.name, err.code || "");
      message = "Lỗi máy chủ. Vui lòng thử lại.";
    }
    res
      .status(status)
      .json({ error: { message, ...(fields ? { fields } : {}) } });
  });
  return app;
}

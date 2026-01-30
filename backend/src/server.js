import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

const app = express();

// 🔥 VERY IMPORTANT (Render + cookies)
app.set("trust proxy", 1);

// ✅ Render-safe PORT
const PORT = process.env.PORT || 5000;

// ✅ CORS (Vercel + Render + localhost)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ✅ Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("TalkSphere Backend is running 🚀");
});

// ✅ Start server
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  await connectDB();
});

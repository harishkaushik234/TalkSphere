// import express from "express";
// import "dotenv/config";
// import cookieParser from "cookie-parser";
// import cors from "cors";
// import path from "path";

// import authRoutes from "./routes/auth.route.js";
// import userRoutes from "./routes/user.route.js";
// import chatRoutes from "./routes/chat.route.js";

// import { connectDB } from "./lib/db.js";

// const app = express();
// const PORT = process.env.PORT || 5000 ;

// const __dirname = path.resolve();

// // app.use(
// //   cors({
// //     origin: "http://localhost:5173",
// //     credentials: true, // allow frontend to send cookies
// //   })
// // );
// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   })
// );


// // Increase body parser limit for base64 images (up to 10MB)
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(cookieParser());

// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/chat", chatRoutes);

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   connectDB();
// });



import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

const app = express();

// ✅ Render-safe PORT
const PORT = process.env.PORT || 5000;

// ✅ CORS (works for localhost + Vercel + Render)
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

// ✅ Health check route (optional but recommended)
app.get("/", (req, res) => {
  res.send("TalkSphere Backend is running 🚀");
});

// ✅ Start server
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  await connectDB();
});


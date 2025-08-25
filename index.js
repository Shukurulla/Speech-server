import express from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import UserRouter from "./routes/user.routes.js";
import CategoryRouter from "./routes/category.routes.js";
import TestRouter from "./routes/test.routes.js";
import testDetailRouter from "./routes/test.details.routes.js";
import AdminRouter from "./routes/admin.routes.js";
import GradeRouter from "./routes/grade.routes.js";
import LessonRouter from "./routes/lesson.routes.js";
import TestResultRouter from "./routes/test.result.routes.js";
import AIRouter from "./routes/ai.routes.js";
import NotificationRouter from "./routes/notification.routes.js";
import MockTestRouter from "./routes/mock.test.routes.js";

config();

const app = express();
const port = process.env.PORT || 5555;
const mongo_uri = process.env.MONGO_URI;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose
  .connect(mongo_uri)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files (audio uploads) - IMPORTANT: This should be accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads/audio",
  express.static(path.join(__dirname, "uploads/audio"))
);

// API Routes
app.use("/api/user", UserRouter);
app.use("/api/category", CategoryRouter);
app.use("/api/test", TestRouter);
app.use("/api/test-detail", testDetailRouter);
app.use("/api/test-result", TestResultRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/grade", GradeRouter);
app.use("/api/lesson", LessonRouter);

app.use("/api/ai", AIRouter);
app.use("/api/notifications", NotificationRouter);
app.use("/api/mock-test", MockTestRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Audio file test endpoint
app.get("/test-audio", (req, res) => {
  const audioPath = path.join(__dirname, "uploads/audio");
  console.log("Audio directory path:", audioPath);
  res.json({
    audioPath,
    message: "Check console for audio directory path",
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      status: "error",
      message: "File size too large. Maximum size is 50MB.",
    });
  }

  if (error.code === "ENOENT") {
    return res.status(404).json({
      status: "error",
      message: "File not found.",
    });
  }

  res.status(500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Admin panel: http://localhost:${port}/api/admin`);
  console.log(`🎵 Audio files: http://localhost:${port}/uploads/audio`);
  console.log(`🎵 Audio test: http://localhost:${port}/test-audio`);
});

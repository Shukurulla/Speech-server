// index.js
import express from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes import
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
import TopicTestRouter from "./routes/topic.test.routes.js";
import VocabularyRouter from "./routes/vocabulary.routes.js";

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
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
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

// New Routes for Updated Features
app.use("/api/mock-test", MockTestRouter);
app.use("/api/topic-test", TopicTestRouter);
app.use("/api/vocabulary", VocabularyRouter); // Replaced dictionary with vocabulary

// Legacy route redirect (if dictionary endpoints are still being called)
app.use("/api/dictionary", (req, res, next) => {
  console.log(
    "⚠️ Legacy dictionary endpoint called, redirecting to vocabulary"
  );
  req.url = req.url.replace("/api/dictionary", "/api/vocabulary");
  VocabularyRouter(req, res, next);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    features: {
      vocabulary: true,
      topicTests: true,
      mockTests: true,
      aiEvaluation: process.env.OPENAI_API_KEY ? true : false,
    },
  });
});

// Audio file test endpoint
app.get("/test-audio", (req, res) => {
  const audioPath = path.join(__dirname, "uploads/audio");
  console.log("🎵 Audio directory path:", audioPath);
  res.json({
    audioPath,
    message: "Check console for audio directory path",
  });
});

// API Documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "English Learning Platform API",
    version: "2.0.0",
    endpoints: {
      auth: {
        login: "POST /api/user/login",
        register: "POST /api/user/register",
        profile: "GET /api/user/profile",
      },
      grades: {
        list: "GET /api/grade",
        create: "POST /api/grade/create",
        update: "PUT /api/grade/:id",
        delete: "DELETE /api/grade/:id",
      },
      lessons: {
        list: "GET /api/lesson/grade/:gradeId",
        create: "POST /api/lesson/create",
        update: "PUT /api/lesson/:id",
        delete: "DELETE /api/lesson/:id",
      },
      vocabulary: {
        list: "GET /api/vocabulary/lesson/:lessonId",
        create: "POST /api/vocabulary/create",
        update: "PUT /api/vocabulary/:id",
        delete: "DELETE /api/vocabulary/:id",
      },
      tests: {
        regular: {
          list: "GET /api/test/all",
          create: "POST /api/test/create",
          details: "GET /api/test/:id",
        },
        topic: {
          byGrade: "GET /api/topic-test/grade/:gradeId",
          byLesson: "GET /api/topic-test/grade/:gradeId/lesson/:lessonNumber",
          create: "POST /api/topic-test/create",
          evaluate: "POST /api/topic-test/evaluate",
          result: "GET /api/topic-test/result/:resultId",
        },
        mock: {
          byGrade: "GET /api/mock-test/grade/:gradeId",
          generate: "POST /api/mock-test/generate/:gradeId",
          submit: "POST /api/mock-test/submit",
          results: "GET /api/mock-test/results",
        },
      },
      admin: {
        dashboard: "GET /api/admin/dashboard",
        students: "GET /api/admin/students",
        results: "GET /api/admin/results",
      },
    },
    features: [
      "✅ Vocabulary system (replaced Dictionary)",
      "✅ Topic Speaking Tests (every 5 lessons)",
      "✅ Mock Tests (20 questions from 20 lessons)",
      "✅ AI Evaluation with ChatGPT",
      "✅ Real-time Speech Recognition",
      "✅ Comprehensive Admin Panel",
    ],
  });
});

// 404 handler for unknown API routes

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Server Error:", error);

  // File size error
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      status: "error",
      message: "File size too large. Maximum size is 50MB.",
    });
  }

  // File not found error
  if (error.code === "ENOENT") {
    return res.status(404).json({
      status: "error",
      message: "File not found.",
    });
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: messages,
    });
  }

  // Mongoose cast error (invalid ID)
  if (error.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format",
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Token expired",
    });
  }

  // Default error
  res.status(error.status || 500).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Start server
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     🚀 English Learning Platform Server v2.0          ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║     📍 Server:     http://localhost:${port}           ║
║     📊 Admin:      http://localhost:${port}/api/admin ║
║     🎵 Audio:      http://localhost:${port}/uploads/audio ║
║     📚 API Docs:   http://localhost:${port}/api       ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║     ✨ New Features:                                  ║
║     • Vocabulary System (replaced Dictionary)         ║
║     • Topic Speaking Tests (5, 10, 15, 20 lessons)    ║
║     • Mock Tests (20 questions comprehensive test)    ║
║     • AI Evaluation with ChatGPT                      ║
║     • Real-time Speech Recognition                    ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║     ${process.env.OPENAI_API_KEY ? "✅" : "⚠️"}  OpenAI API Key: ${
    process.env.OPENAI_API_KEY ? "Configured" : "Not configured"
  }       ║
║     ✅ Database:   Connected                          ║
║     ✅ CORS:       Enabled                            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.log(`
⚠️  WARNING: OpenAI API key not configured!
   Topic test AI evaluation will use fallback mode.
   To enable AI evaluation, add OPENAI_API_KEY to your .env file.
    `);
  }
});

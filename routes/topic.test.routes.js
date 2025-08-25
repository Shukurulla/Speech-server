import express from "express";
import {
  createTopicTest,
  updateTopicTest,
  deleteTopicTest,
  getTopicTestsByGrade,
  getTopicTestByLesson,
  evaluateTopicTest,
  getTopicTestResult,
  getUserTopicTestResults,
} from "../controllers/topic.test.controller.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

// Admin routes
router.post("/create", authMiddleware, adminOnly, createTopicTest);
router.put("/:id", authMiddleware, adminOnly, updateTopicTest);
router.delete("/:id", authMiddleware, adminOnly, deleteTopicTest);

// Public routes
router.get("/grade/:gradeId", getTopicTestsByGrade);
router.get("/grade/:gradeId/lesson/:lessonNumber", getTopicTestByLesson);

// User routes
router.post("/evaluate", authMiddleware, evaluateTopicTest);
router.get("/result/:resultId", getTopicTestResult);
router.get("/results", authMiddleware, getUserTopicTestResults);

export default router;

// routes/test.result.routes.js
import express from "express";
import TestResult from "../models/test.result.js";
import User from "../models/user.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { catchError, successData } from "../utils/responses.js";
import mongoose from "mongoose";

const router = express.Router();

// Submit test result
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.userData;

    if (role === "admin") {
      return res.status(400).json({
        status: "error",
        message: "Test results can only be submitted by students",
      });
    }

    const {
      testId,
      lessonId,
      gradeId,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken,
      answers,
      feedback,
    } = req.body;

    // Validate required fields
    if (
      !testId ||
      !lessonId ||
      !gradeId ||
      score === undefined ||
      !totalQuestions ||
      correctAnswers === undefined
    ) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields",
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(testId) ||
      !mongoose.Types.ObjectId.isValid(lessonId) ||
      !mongoose.Types.ObjectId.isValid(gradeId)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid ID format",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Get attempt number for this test
    const previousAttempts = await TestResult.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      testId: new mongoose.Types.ObjectId(testId),
    });

    // Create test result
    const testResult = await TestResult.create({
      userId: new mongoose.Types.ObjectId(userId),
      testId: new mongoose.Types.ObjectId(testId),
      lessonId: new mongoose.Types.ObjectId(lessonId),
      gradeId: new mongoose.Types.ObjectId(gradeId),
      score: Math.min(100, Math.max(0, Math.round(score))),
      totalQuestions,
      correctAnswers,
      timeTaken: timeTaken || 0,
      answers: answers || [],
      feedback: feedback || "",
      attemptNumber: previousAttempts + 1,
    });

    // Update user's completed tests
    const existingTestIndex = user.complateTests.findIndex(
      (test) => test.testId.toString() === testId
    );

    if (existingTestIndex >= 0) {
      // Update existing test if new score is better
      if (user.complateTests[existingTestIndex].score < score) {
        user.complateTests[existingTestIndex].score = Math.round(score);
        user.complateTests[existingTestIndex].complateDate =
          new Date().toISOString();
      }
    } else {
      // Add new test result
      user.complateTests.push({
        testId: new mongoose.Types.ObjectId(testId),
        score: Math.round(score),
        complateDate: new Date().toISOString(),
      });
    }

    await user.save();

    // Populate the result for response
    const populatedResult = await TestResult.findById(testResult._id)
      .populate("gradeId", "name")
      .populate("lessonId", "title");

    res.status(201).json({
      status: "success",
      message: "Test result submitted successfully",
      data: populatedResult,
    });
  } catch (error) {
    console.error("Error submitting test result:", error);
    catchError(res, error);
  }
});

// Get user's test results
router.get("/my-results", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { page = 1, limit = 10, testId, lessonId, gradeId } = req.query;

    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (testId) query.testId = new mongoose.Types.ObjectId(testId);
    if (lessonId) query.lessonId = new mongoose.Types.ObjectId(lessonId);
    if (gradeId) query.gradeId = new mongoose.Types.ObjectId(gradeId);

    const results = await TestResult.find(query)
      .populate("gradeId", "name")
      .populate("lessonId", "title")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TestResult.countDocuments(query);

    res.json({
      status: "success",
      data: {
        results,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching test results:", error);
    catchError(res, error);
  }
});

// Get test statistics for user
router.get("/statistics", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const stats = await TestResult.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          totalTime: { $sum: "$timeTaken" },
          totalQuestions: { $sum: "$totalQuestions" },
          totalCorrectAnswers: { $sum: "$correctAnswers" },
        },
      },
    ]);

    const gradeStats = await TestResult.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$gradeId",
          testsCount: { $sum: 1 },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "_id",
          as: "grade",
        },
      },
    ]);

    const recentResults = await TestResult.find({ userId: userObjectId })
      .populate("gradeId", "name")
      .populate("lessonId", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      status: "success",
      data: {
        overall: stats[0] || {
          totalTests: 0,
          averageScore: 0,
          bestScore: 0,
          totalTime: 0,
          totalQuestions: 0,
          totalCorrectAnswers: 0,
        },
        byGrade: gradeStats,
        recent: recentResults,
      },
    });
  } catch (error) {
    console.error("Error fetching test statistics:", error);
    catchError(res, error);
  }
});

// Get specific test result details
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid test result ID",
      });
    }

    const result = await TestResult.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate("gradeId", "name")
      .populate("lessonId", "title");

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Test result not found",
      });
    }

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching test result:", error);
    catchError(res, error);
  }
});

// Delete test result (user can delete their own results)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid test result ID",
      });
    }

    const result = await TestResult.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Test result not found",
      });
    }

    // Also remove from user's complateTests array
    const user = await User.findById(userId);
    if (user) {
      user.complateTests = user.complateTests.filter(
        (test) => test.testId.toString() !== result.testId.toString()
      );
      await user.save();
    }

    res.json({
      status: "success",
      message: "Test result deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test result:", error);
    catchError(res, error);
  }
});

export default router;

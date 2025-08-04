import express from "express";
import User from "../models/user.model.js";
import Grade from "../models/grade.model.js";
import Lesson from "../models/lesson.model.js";
import TestResult from "../models/test.result.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Dashboard stats
router.get("/dashboard", authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalGrades = await Grade.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalTests = await TestResult.countDocuments();

    const recentResults = await TestResult.find()
      .populate("userId", "firstname lastname email")
      .populate("gradeId", "name")
      .populate("lessonId", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    const topScores = await TestResult.aggregate([
      {
        $group: {
          _id: "$userId",
          avgScore: { $avg: "$score" },
          totalTests: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
    ]);

    const gradeStats = await TestResult.aggregate([
      {
        $group: {
          _id: "$gradeId",
          totalTests: { $sum: 1 },
          avgScore: { $avg: "$score" },
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

    res.json({
      status: "success",
      data: {
        stats: {
          totalUsers,
          totalGrades,
          totalLessons,
          totalTests,
        },
        recentResults,
        topScores,
        gradeStats,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get all users with their test results
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = { role: "user" };
    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Get test stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const testStats = await TestResult.aggregate([
          { $match: { userId: user._id } },
          {
            $group: {
              _id: null,
              totalTests: { $sum: 1 },
              avgScore: { $avg: "$score" },
              bestScore: { $max: "$score" },
            },
          },
        ]);

        return {
          ...user.toObject(),
          stats: testStats[0] || { totalTests: 0, avgScore: 0, bestScore: 0 },
        };
      })
    );

    res.json({
      status: "success",
      data: {
        users: usersWithStats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get user details with all test results
router.get("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const testResults = await TestResult.find({ userId: req.params.id })
      .populate("gradeId", "name")
      .populate("lessonId", "title")
      .sort({ createdAt: -1 });

    const stats = await TestResult.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          totalTime: { $sum: "$timeTaken" },
        },
      },
    ]);

    res.json({
      status: "success",
      data: {
        user,
        testResults,
        stats: stats[0] || {
          totalTests: 0,
          avgScore: 0,
          bestScore: 0,
          totalTime: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get test results with filters
router.get("/results", authMiddleware, adminOnly, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      gradeId,
      lessonId,
      userId,
      minScore,
      maxScore,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    if (gradeId) query.gradeId = gradeId;
    if (lessonId) query.lessonId = lessonId;
    if (userId) query.userId = userId;
    if (minScore) query.score = { $gte: parseInt(minScore) };
    if (maxScore) query.score = { ...query.score, $lte: parseInt(maxScore) };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const results = await TestResult.find(query)
      .populate("userId", "firstname lastname email")
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
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Export results to CSV
router.get("/export/results", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { gradeId, lessonId, startDate, endDate } = req.query;

    const query = {};
    if (gradeId) query.gradeId = gradeId;
    if (lessonId) query.lessonId = lessonId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const results = await TestResult.find(query)
      .populate("userId", "firstname lastname email")
      .populate("gradeId", "name")
      .populate("lessonId", "title")
      .sort({ createdAt: -1 });

    const csvData = results.map((result) => ({
      studentName: `${result.userId.firstname} ${result.userId.lastname}`,
      email: result.userId.email,
      grade: result.gradeId.name,
      lesson: result.lessonId.title,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      timeTaken: result.timeTaken,
      date: result.createdAt.toISOString().split("T")[0],
    }));

    res.json({
      status: "success",
      data: csvData,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;

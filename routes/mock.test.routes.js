// routes/mock.test.routes.js
import express from "express";
import MockTest from "../models/mock.test.model.js";
import Test from "../models/test.model.js";
import TestDetail from "../models/test.detail.model.js";
import Lesson from "../models/lesson.model.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Generate mock test for a grade (20 questions from 20 lessons)
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { gradeId } = req.body;

    if (!gradeId) {
      return res.status(400).json({
        status: "error",
        message: "Grade ID is required",
      });
    }

    // Get all lessons for the grade
    const lessons = await Lesson.find({ gradeId, isActive: true })
      .sort({ orderNumber: 1 })
      .limit(20);

    if (lessons.length < 20) {
      return res.status(400).json({
        status: "error",
        message: "Not enough lessons available for mock test. Need 20 lessons.",
      });
    }

    // Get one test from each lesson
    const mockQuestions = [];

    for (const lesson of lessons) {
      // Get tests for this lesson
      const tests = await Test.find({
        lessonId: lesson._id,
        isActive: true,
      });

      if (tests.length > 0) {
        // Randomly select speech or listening test
        const randomTest = tests[Math.floor(Math.random() * tests.length)];

        // Get test details
        const testDetails = await TestDetail.find({
          parentId: randomTest._id,
        }).limit(1);

        if (testDetails.length > 0) {
          mockQuestions.push({
            lessonId: lesson._id,
            testId: randomTest._id,
            questionType: randomTest.type || "speech",
            question: testDetails[0],
          });
        }
      }
    }

    if (mockQuestions.length < 20) {
      return res.status(400).json({
        status: "error",
        message: "Not enough test questions available for all lessons",
      });
    }

    res.json({
      status: "success",
      data: {
        gradeId,
        questions: mockQuestions,
        totalQuestions: mockQuestions.length,
      },
    });
  } catch (error) {
    console.error("Error generating mock test:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate mock test",
    });
  }
});

// Submit mock test results
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { gradeId, questions, overallScore, totalTimeTaken } = req.body;

    if (!gradeId || !questions || questions.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid test data",
      });
    }

    // Calculate passed questions (score >= 70)
    const passedQuestions = questions.filter((q) => q.score >= 70).length;
    const isPassed = overallScore >= 80; // 80% pass mark

    // Create mock test record
    const mockTest = await MockTest.create({
      userId,
      gradeId,
      questions: questions.map((q) => ({
        lessonId: q.lessonId,
        testId: q.testId,
        questionType: q.questionType,
        userAnswer: q.userAnswer,
        score: q.score,
        timeTaken: q.timeTaken || 0,
      })),
      overallScore,
      totalQuestions: questions.length,
      passedQuestions,
      totalTimeTaken,
      isPassed,
    });

    res.json({
      status: "success",
      message: isPassed
        ? "Congratulations! You passed the mock test!"
        : "Keep practicing!",
      data: {
        testId: mockTest._id,
        overallScore,
        passedQuestions,
        totalQuestions: questions.length,
        isPassed,
      },
    });
  } catch (error) {
    console.error("Error submitting mock test:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to submit mock test",
    });
  }
});

// Get user's mock test history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { gradeId, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (gradeId) {
      query.gradeId = gradeId;
    }

    const tests = await MockTest.find(query)
      .populate("gradeId", "name")
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MockTest.countDocuments(query);

    res.json({
      status: "success",
      data: {
        tests,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching mock test history:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch test history",
    });
  }
});

// Get specific mock test details
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { id } = req.params;

    const mockTest = await MockTest.findOne({ _id: id, userId })
      .populate("gradeId", "name")
      .populate("questions.lessonId", "title orderNumber")
      .populate("questions.testId", "title category");

    if (!mockTest) {
      return res.status(404).json({
        status: "error",
        message: "Mock test not found",
      });
    }

    res.json({
      status: "success",
      data: mockTest,
    });
  } catch (error) {
    console.error("Error fetching mock test:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch mock test",
    });
  }
});

// Check if user can take mock test for a grade
router.get("/check-eligibility/:gradeId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { gradeId } = req.params;

    // Check if there are 20 lessons
    const lessonCount = await Lesson.countDocuments({
      gradeId,
      isActive: true,
    });

    if (lessonCount < 20) {
      return res.json({
        status: "success",
        data: {
          eligible: false,
          reason: `Only ${lessonCount} lessons available. Need 20 lessons for mock test.`,
          lessonCount,
        },
      });
    }

    // Check last mock test date (optional cooldown)
    const lastTest = await MockTest.findOne({ userId, gradeId }).sort({
      completedAt: -1,
    });

    const cooldownHours = 24; // 24 hour cooldown
    if (lastTest) {
      const hoursSinceLastTest =
        (Date.now() - new Date(lastTest.completedAt).getTime()) /
        (1000 * 60 * 60);

      if (hoursSinceLastTest < cooldownHours) {
        return res.json({
          status: "success",
          data: {
            eligible: false,
            reason: `Please wait ${Math.ceil(
              cooldownHours - hoursSinceLastTest
            )} more hours before taking another mock test.`,
            nextAvailable: new Date(
              new Date(lastTest.completedAt).getTime() +
                cooldownHours * 60 * 60 * 1000
            ),
          },
        });
      }
    }

    res.json({
      status: "success",
      data: {
        eligible: true,
        lessonCount,
        lastTestDate: lastTest?.completedAt || null,
      },
    });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to check eligibility",
    });
  }
});

export default router;

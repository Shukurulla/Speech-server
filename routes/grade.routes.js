import express from "express";
import Grade from "../models/grade.model.js";
import Lesson from "../models/lesson.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get all grades
router.get("/", authMiddleware, async (req, res) => {
  try {
    const grades = await Grade.find({ isActive: true }).sort({ name: 1 });
    res.json({ status: "success", data: grades });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get grade by ID with lessons
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res
        .status(404)
        .json({ status: "error", message: "Grade not found" });
    }

    const lessons = await Lesson.find({
      gradeId: req.params.id,
      isActive: true,
    }).sort({ orderNumber: 1 });

    res.json({
      status: "success",
      data: {
        grade,
        lessons,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Create new grade (Admin only)
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Grade name is required",
      });
    }

    const existingGrade = await Grade.findOne({ name });
    if (existingGrade) {
      return res.status(400).json({
        status: "error",
        message: "Grade with this name already exists",
      });
    }

    const grade = await Grade.create({ name, description });
    res.status(201).json({ status: "success", data: grade });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Update grade (Admin only)
router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res
        .status(404)
        .json({ status: "error", message: "Grade not found" });
    }

    if (name && name !== grade.name) {
      const existingGrade = await Grade.findOne({
        name,
        _id: { $ne: req.params.id },
      });
      if (existingGrade) {
        return res.status(400).json({
          status: "error",
          message: "Grade with this name already exists",
        });
      }
    }

    const updatedGrade = await Grade.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true }
    );

    res.json({ status: "success", data: updatedGrade });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Delete grade (Admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res
        .status(404)
        .json({ status: "error", message: "Grade not found" });
    }

    // Check if grade has lessons
    const lessonsCount = await Lesson.countDocuments({
      gradeId: req.params.id,
    });
    if (lessonsCount > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete grade with existing lessons",
      });
    }

    await Grade.findByIdAndDelete(req.params.id);
    res.json({
      status: "success",
      message: "Grade deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;

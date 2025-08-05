import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Lesson from "../models/lesson.model.js";
import Grade from "../models/grade.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import lessonModel from "../models/lesson.model.js";

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/audio/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const allowedExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];
const allowedMimeTypes = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4", // m4a
  "audio/x-m4a", // ayrim holatlarda
  "audio/aac",
  "audio/x-hx-aac-adts",
];

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (
      allowedExtensions.includes(ext) &&
      allowedMimeTypes.includes(mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only valid audio files are allowed"));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Get lessons by grade
router.get("/grade/:gradeId", authMiddleware, async (req, res) => {
  try {
    const lessons = await Lesson.find({
      gradeId: req.params.gradeId,
      isActive: true,
    }).sort({ orderNumber: 1 });

    // Add full URL for audio files
    const lessonsWithAudioUrls = lessons.map((lesson) => {
      const lessonObj = lesson.toObject();
      if (lessonObj.audioFiles && lessonObj.audioFiles.length > 0) {
        lessonObj.audioFiles = lessonObj.audioFiles.map((audioFile) => ({
          ...audioFile,
          url: `${req.protocol}://${req.get("host")}/uploads/audio/${
            audioFile.filename
          }`,
          downloadUrl: `${req.protocol}://${req.get("host")}/api/lesson/${
            lesson._id
          }/audio/${audioFile.filename}`,
        }));
      }
      return lessonObj;
    });

    res.json({ status: "success", data: lessonsWithAudioUrls });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get lesson by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate(
      "gradeId",
      "name"
    );

    if (!lesson) {
      return res
        .status(404)
        .json({ status: "error", message: "Lesson not found" });
    }

    // Add full URL for audio files
    const lessonObj = lesson.toObject();
    if (lessonObj.audioFiles && lessonObj.audioFiles.length > 0) {
      lessonObj.audioFiles = lessonObj.audioFiles.map((audioFile) => ({
        ...audioFile,
        url: `${req.protocol}://${req.get("host")}/uploads/audio/${
          audioFile.filename
        }`,
        downloadUrl: `${req.protocol}://${req.get("host")}/api/lesson/${
          lesson._id
        }/audio/${audioFile.filename}`,
      }));
    }

    res.json({ status: "success", data: lessonObj });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Create new lesson (Admin only)
router.post(
  "/",
  authMiddleware,
  adminOnly,
  upload.array("audioFiles", 5),
  async (req, res) => {
    try {
      const { title, description, gradeId, orderNumber } = req.body;

      if (!title || !gradeId) {
        return res.status(400).json({
          status: "error",
          message: "Title and grade are required",
        });
      }

      // Check if grade exists
      const grade = await Grade.findById(gradeId);
      if (!grade) {
        return res
          .status(404)
          .json({ status: "error", message: "Grade not found" });
      }

      // Get next order number if not provided
      let nextOrderNumber = orderNumber;
      if (!nextOrderNumber) {
        const lastLesson = await Lesson.findOne({ gradeId }).sort({
          orderNumber: -1,
        });
        nextOrderNumber = lastLesson ? lastLesson.orderNumber + 1 : 1;
      }

      // Check if order number already exists
      const existingLesson = await Lesson.findOne({
        gradeId,
        orderNumber: nextOrderNumber,
      });
      if (existingLesson) {
        return res.status(400).json({
          status: "error",
          message: "Lesson with this order number already exists",
        });
      }

      // Process uploaded audio files
      const audioFiles = req.files
        ? req.files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
          }))
        : [];

      const lesson = await Lesson.create({
        title,
        description,
        gradeId,
        orderNumber: nextOrderNumber,
        audioFiles,
      });

      res.status(201).json({ status: "success", data: lesson });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

// Update lesson (Admin only)
router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  upload.array("audioFiles", 5),
  async (req, res) => {
    try {
      const { title, description, orderNumber, isActive } = req.body;

      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) {
        return res
          .status(404)
          .json({ status: "error", message: "Lesson not found" });
      }

      // Check order number conflict
      if (orderNumber && orderNumber !== lesson.orderNumber) {
        const existingLesson = await Lesson.findOne({
          gradeId: lesson.gradeId,
          orderNumber: orderNumber,
          _id: { $ne: req.params.id },
        });
        if (existingLesson) {
          return res.status(400).json({
            status: "error",
            message: "Lesson with this order number already exists",
          });
        }
      }

      // Process new audio files
      const newAudioFiles = req.files
        ? req.files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
          }))
        : [];

      const updateData = {
        title: title || lesson.title,
        description: description || lesson.description,
        orderNumber: orderNumber || lesson.orderNumber,
        isActive: isActive !== undefined ? isActive : lesson.isActive,
      };

      // Add new audio files to existing ones
      if (newAudioFiles.length > 0) {
        updateData.audioFiles = [...lesson.audioFiles, ...newAudioFiles];
      }

      const updatedLesson = await Lesson.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json({ status: "success", data: updatedLesson });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

// Delete audio file from lesson
router.delete(
  "/:id/audio/:audioId",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) {
        return res
          .status(404)
          .json({ status: "error", message: "Lesson not found" });
      }

      const audioFileIndex = lesson.audioFiles.findIndex(
        (file) => file._id.toString() === req.params.audioId
      );

      if (audioFileIndex === -1) {
        return res
          .status(404)
          .json({ status: "error", message: "Audio file not found" });
      }

      // Delete physical file
      const audioFile = lesson.audioFiles[audioFileIndex];
      if (fs.existsSync(audioFile.path)) {
        fs.unlinkSync(audioFile.path);
      }

      // Remove from array
      lesson.audioFiles.splice(audioFileIndex, 1);
      await lesson.save();

      res.json({
        status: "success",
        message: "Audio file deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

// Delete lesson (Admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res
        .status(404)
        .json({ status: "error", message: "Lesson not found" });
    }

    // Delete all audio files
    lesson.audioFiles.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    await Lesson.findByIdAndDelete(req.params.id);
    res.json({
      status: "success",
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Serve audio files - Updated route
router.get("/:id/audio/:filename", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res
        .status(404)
        .json({ status: "error", message: "Lesson not found" });
    }

    const audioFile = lesson.audioFiles.find(
      (file) => file.filename === req.params.filename
    );

    if (!audioFile) {
      return res
        .status(404)
        .json({ status: "error", message: "Audio file not found in lesson" });
    }

    const filePath = path.resolve(audioFile.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ status: "error", message: "Audio file not found on disk" });
    }

    // Set appropriate headers
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${audioFile.originalName}"`
    );

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error serving audio file:", error);
    res
      .status(500)
      .json({ status: "error", message: "Error serving audio file" });
  }
});

// Test audio directory endpoint
router.get(
  "/test/audio-directory",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const audioDir = path.resolve("uploads/audio");
      const files = fs.existsSync(audioDir) ? fs.readdirSync(audioDir) : [];

      res.json({
        status: "success",
        data: {
          audioDirectory: audioDir,
          exists: fs.existsSync(audioDir),
          files: files.length,
          fileList: files.slice(0, 10), // Show first 10 files
        },
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

router.post("/:id/create-dictionary", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const findLesson = await lessonModel.findById(id);
    if (!findLesson) {
      return res
        .status(400)
        .json({ status: "error", message: "Lesson not found" });
    }

    const dictionaries = findLesson.dictionaries.push(req.body);

    const updateLesson = await lessonModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...findLesson,
          dictionaries,
        },
      },
      {
        new: true,
      }
    );
    res.status(200).json({ status: "success", data: updateLesson });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;

import mongoose from "mongoose";

const mockTestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    gradeId: {
      type: mongoose.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    questions: [
      {
        lessonId: {
          type: mongoose.Types.ObjectId,
          ref: "Lesson",
        },
        testId: {
          type: mongoose.Types.ObjectId,
          ref: "test",
        },
        questionType: {
          type: String,
          enum: ["speech", "listening"],
        },
        userAnswer: String,
        score: Number,
        timeTaken: Number, // seconds
      },
    ],
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    totalQuestions: {
      type: Number,
      default: 20,
    },
    passedQuestions: {
      type: Number,
    },
    totalTimeTaken: {
      type: Number, // seconds
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// models/topic.test.model.js
import mongoose from "mongoose";

const topicTestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    topicDescription: {
      type: String,
      required: true,
    },
    lessonRange: {
      type: String,
      required: true, // e.g., "Lessons 1-5", "Lessons 6-10"
    },
    userSpeech: {
      type: String,
      required: true,
    },
    analysis: {
      relevanceScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      grammarScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      vocabularyScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      fluencyScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      feedback: {
        strengths: [String],
        improvements: [String],
        grammarIssues: [String],
      },
      detailedAnalysis: String,
    },
    audioUrl: {
      type: String, // Optional: URL to stored audio recording
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
mockTestSchema.index({ userId: 1, gradeId: 1, completedAt: -1 });

export default mongoose.model("MockTest", mockTestSchema);

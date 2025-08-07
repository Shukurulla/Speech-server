import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    lessonId: {
      type: mongoose.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    gradeId: {
      type: mongoose.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    category: {
      title: {
        type: String,
        required: true,
      },
      _id: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    type: {
      type: String,
      enum: ["speech", "listening"],
      default: "speech", // Default to speech test for backward compatibility
    },
    orderNumber: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("test", testSchema);

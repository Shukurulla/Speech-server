import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    gradeId: {
      type: mongoose.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    orderNumber: {
      type: Number,
      required: true,
    },
    audioFiles: [
      {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    dictionaries: [
      {
        en: {
          type: String,
        },
        uz: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for grade and order
lessonSchema.index({ gradeId: 1, orderNumber: 1 }, { unique: true });

export default mongoose.model("Lesson", lessonSchema);

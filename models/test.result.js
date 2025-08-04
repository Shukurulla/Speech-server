import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    testId: {
      type: mongoose.Types.ObjectId,
      ref: "test",
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
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    timeTaken: {
      type: Number, // seconds
      default: 0,
    },
    answers: [
      {
        questionId: mongoose.Types.ObjectId,
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        score: Number,
      },
    ],
    feedback: {
      type: String,
      default: "",
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
testResultSchema.index({ userId: 1, testId: 1, createdAt: -1 });
testResultSchema.index({ gradeId: 1, lessonId: 1, createdAt: -1 });

export default mongoose.model("TestResult", testResultSchema);

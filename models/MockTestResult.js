import mongoose from "mongoose";
const Schema = mongoose.Schema;

const MockTestResultSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mockTestId: {
    type: Schema.Types.ObjectId,
    ref: "MockTest",
    required: true,
  },
  gradeId: {
    type: Schema.Types.ObjectId,
    ref: "Grade",
    required: true,
  },
  answers: [
    {
      questionId: {
        type: Schema.Types.ObjectId,
        ref: "TestDetail",
        required: true,
      },
      lessonNumber: Number,
      questionType: {
        type: String,
        enum: ["listening", "speaking"],
      },
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      timeSpent: Number, // seconds
    },
  ],
  totalScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  correctAnswers: Number,
  wrongAnswers: Number,
  passed: Boolean,
  totalTimeSpent: Number, // seconds
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate scores before saving
MockTestResultSchema.pre("save", function (next) {
  if (this.answers && this.answers.length > 0) {
    this.correctAnswers = this.answers.filter((a) => a.isCorrect).length;
    this.wrongAnswers = this.answers.filter((a) => !a.isCorrect).length;

    const totalScore = this.answers.reduce(
      (sum, answer) => sum + (answer.score || 0),
      0
    );
    this.totalScore = Math.round(totalScore / this.answers.length);

    this.passed = this.totalScore >= 60; // Default passing score
    this.completedAt = Date.now();
  }
  next();
});

export default mongoose.model("MockTestResult", MockTestResultSchema);

import mongoose from "mongoose";
const Schema = mongoose.Schema;

const MockTestSchema = new Schema({
  gradeId: {
    type: Schema.Types.ObjectId,
    ref: "Grade",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  questions: [
    {
      lessonId: {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
        required: true,
      },
      lessonNumber: {
        type: Number,
        required: true,
      },
      testDetailId: {
        type: Schema.Types.ObjectId,
        ref: "TestDetail",
        required: true,
      },
      questionType: {
        type: String,
        enum: ["listening", "speaking"],
        required: true,
      },
      order: {
        type: Number,
        required: true,
      },
    },
  ],
  totalQuestions: {
    type: Number,
    default: 20,
  },
  passingScore: {
    type: Number,
    default: 60,
    min: 0,
    max: 100,
  },
  timeLimit: {
    type: Number,
    default: 60, // minutes
    min: 20,
    max: 180,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure exactly 20 questions (one from each lesson)
MockTestSchema.pre("save", function (next) {
  if (this.questions.length !== 20) {
    next(new Error("Mock test must have exactly 20 questions"));
  } else {
    this.updatedAt = Date.now();
    this.totalQuestions = this.questions.length;
    next();
  }
});

export default mongoose.model("MockTest", MockTestSchema);

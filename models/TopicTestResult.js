import mongoose from "mongoose";
const Schema = mongoose.Schema;

const TopicTestResultSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  topicTestId: {
    type: Schema.Types.ObjectId,
    ref: "TopicTest",
    required: true,
  },
  gradeId: {
    type: Schema.Types.ObjectId,
    ref: "Grade",
    required: true,
  },
  lessonNumber: {
    type: Number,
    required: true,
  },
  spokenText: {
    type: String,
    required: true,
  },
  aiEvaluation: {
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
    fluencyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    vocabularyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: String,
    corrections: [
      {
        original: String,
        corrected: String,
        explanation: String,
      },
    ],
    strengths: [String],
    improvements: [String],
  },
  duration: Number, // seconds
  wordCount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate word count before saving
TopicTestResultSchema.pre("save", function (next) {
  if (this.spokenText) {
    this.wordCount = this.spokenText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
  next();
});

export default mongoose.model("TopicTestResult", TopicTestResultSchema);

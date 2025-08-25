import mongoose from "mongoose";
const Schema = mongoose.Schema;

const TopicTestSchema = new Schema({
  gradeId: {
    type: Schema.Types.ObjectId,
    ref: "Grade",
    required: true,
  },
  afterLesson: {
    type: Number,
    required: true,
    enum: [5, 10, 15, 20], // Only after these lessons
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  prompt: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: Number,
    default: 60,
    min: 30,
    max: 300,
  },
  criteria: {
    relevance: {
      type: Number,
      default: 30,
      min: 0,
      max: 100,
    },
    grammar: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    fluency: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    vocabulary: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
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

// Validate that criteria weights sum to 100
TopicTestSchema.pre("save", function (next) {
  const sum =
    this.criteria.relevance +
    this.criteria.grammar +
    this.criteria.fluency +
    this.criteria.vocabulary;
  if (sum !== 100) {
    next(new Error("Criteria weights must sum to 100"));
  } else {
    this.updatedAt = Date.now();
    next();
  }
});

export default mongoose.model("TopicTest", TopicTestSchema);

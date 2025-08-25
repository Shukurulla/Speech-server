import mongoose from "mongoose";
const Schema = mongoose.Schema;

const VocabularySchema = new Schema({
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  gradeId: {
    type: Schema.Types.ObjectId,
    ref: "Grade",
    required: true,
  },
  word: {
    type: String,
    required: true,
    trim: true,
  },
  definition: {
    type: String,
    required: true,
  },
  partOfSpeech: {
    type: String,
    enum: [
      "noun",
      "verb",
      "adjective",
      "adverb",
      "pronoun",
      "preposition",
      "conjunction",
      "interjection",
    ],
    required: true,
  },
  example: {
    type: String,
    required: true,
  },
  pronunciation: {
    type: String,
    trim: true,
  },
  audioUrl: {
    type: String,
    trim: true,
  },
  synonyms: [
    {
      type: String,
      trim: true,
    },
  ],
  antonyms: [
    {
      type: String,
      trim: true,
    },
  ],
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
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

// Update timestamp on save
VocabularySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for better search performance
VocabularySchema.index({ word: 1, lessonId: 1 });
VocabularySchema.index({ gradeId: 1, lessonId: 1 });

export default mongoose.model("Vocabulary", VocabularySchema);

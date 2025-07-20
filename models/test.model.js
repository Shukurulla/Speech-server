import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("test", testSchema);

import mongoose from "mongoose";

const testDetailSchema = new mongoose.Schema(
  {
    condition: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    parentId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("test-detail", testDetailSchema);

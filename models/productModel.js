import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    defaultImage: {
      data: Buffer,
      contentType: String,
    },
    hoverImage: {
      data: Buffer,
      contentType: String,
    },
    subtitle: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
    },
    rating: {
      type: Number,
      required: true,
    },
    minDimension: {
      type: String,
      required: true,
    },
    maxDimension: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);

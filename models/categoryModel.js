import mongoose from "mongoose";

const categoryScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    data: Buffer,
    contentType: String,
  },
  bannerImage: {
    data: Buffer,
    contentType: String,
  },
  products: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Product",
    },
  ],
});

export default mongoose.model("Category", categoryScheme);

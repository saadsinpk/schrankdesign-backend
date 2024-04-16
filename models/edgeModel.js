import mongoose from "mongoose"

const edgeModel = new mongoose.Schema({
  images: {
    type: [String],
    required: [true, "images are Required"],
  },
  name: {
    type: String,
    required: true,
  },
  configId: {
    type: String,
    required: true,
  },
  edge_cost: {
    type: String,
    required: true,
  },
  price_aufschlag: {
    type: String,
    required: true,
  },
  supplier_id: {
    type: String,
    required: true,
  },
  plate_Id_match: {
    type: String,
    required: true,
  },
  edge_width: {
    type: String,
    required: true,
  },
  edge_thickness: {
    type: String,
    required: true,
  },
  edge_type: {
    type: String,
    required: true,
  },
})

export default mongoose.model("Edge", edgeModel)

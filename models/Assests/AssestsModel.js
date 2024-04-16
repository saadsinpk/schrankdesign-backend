import mongoose from "mongoose"

const assetsModel = new mongoose.Schema({
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
  supplier_id: {
    type: String,
    required: true,
  },
  price_einkauf: {
    type: String,
    required: true,
  },
  price_aufschlag: {
    type: String,
    required: true,
  },
  price_verkauf: {
    type: String,
    // required: true,
  },
  profit_pro_pcs: {
    type: String,
    // required: true,
  },
  assetsType: {
    type: String,
  },
  list: [
    {
      type: {
        type: String,
      },
      // Add other fields as needed
      config_id: [String],
      child_name: [String],
      child_config_id: [String],
      supplier_id: [String],
      functions: [String],
      add_distance: [
        {
          type: {
            type: String,
          },
          functions_distance: [String],
          functions_from: [String],
          functions_quantity: [String],
          functions_to: [String],
        },
      ],
      qty: [String],
      images: [String],
    },
  ],
})

export default mongoose.model("assets", assetsModel)

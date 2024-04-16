import mongoose from "mongoose";

const PartlistSchema = new mongoose.Schema({
  // name: {
  //   type: String,
  //   required: true,
  // },
  // supp_id: {
  //   type: String,
  //   required: true,
  // },
  config_id: {
    type: String,
  },
  
    images:[
    {
      type: [String],
      required: true,
    },
  ],
  child_name: [
    {
      type: String,
      required: true,
    },
  ],
  child_config_id: [
    {
      type: String,
      required: true,
    },
  ],
  supplier_id: [
    {
      type: String,
    },
  ],
  edge_size: [
    {
      type: String,
      required: true,
    },
  ],
  functions: [
    {
      type: String,
      required: true,
    },
  ],
  functions_distance: [
    {
      type: String,
      required: false,
    },
  ],
  functions_from: [
    {
      type: String,
      required: false,
    },
  ],
  functions_quantity: [
    {
      type: String,
      required: false,
    },
  ],
  functions_to: [
    {
      type: String,
      required: false,
    },
  ],
  qty: [
    {
      type: String,
      required: true,
    },
  ],
   
});

export default mongoose.model("PartList", PartlistSchema);

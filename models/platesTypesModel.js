import mongoose from "mongoose";

const platesTypesModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  configId:{
    type: String,

  },

  config_0: {
    type: String,
    required: true,
  },
  // config_1: {
  //   type: String,
  //   required: true,
  // },
  // config_2: {
  //   type: String,
  //   required: true,
  // },
  // config_3: {
  //   type: String,
  //   required: true,
  // },

  edge_0: {
    type: String,
    required: true,
  },
  // edge_1: {
  //   type: String,
  //   required: true,
  // },
  // edge_2: {
  //   type: String,
  //   required: true,
  // },
  // edge_3: {
  //   type: String,
  //   required: true,
  // },
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
          }
      ],
        qty: [String],
        images: [String]
    }
]
});

export default mongoose.model("platesTypes", platesTypesModel);
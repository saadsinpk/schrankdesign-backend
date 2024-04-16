import mongoose from "mongoose";

// Parent schema remains the same but includes the extended child schema in the children array
// 
const TestPartList =  new mongoose.Schema({
  name:String,
  configId:String,
  config_0:String,
  edge_0:String,
  PlateDepth:String,
  MaterialName:String,
  PlateLength:String,
  plateConfigId:String,
  list:[],
  images:[String],
  platesData: [{
    type: mongoose.Schema.Types.Mixed, // Change this to Array or specific type if needed
  }],

  supplier_id:String,
  price_einkauf:String,
  price_aufschlag:String,
  assetsType:String,
 
});

const TestPartLists = mongoose.model("TestPartList", TestPartList);

export default TestPartLists;
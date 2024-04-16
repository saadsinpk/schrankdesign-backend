import mongoose from "mongoose";

const Addvariable = new mongoose.Schema({
    material_name:{
        type:String,
        required:false
    },
    config_id:{
        type:String,
        required:false
    },
    value:{
        type:String,
        required:false
    },
    test_result:{
        type:String,
        required:false
    },
    var_type : {
        type:String,
        required :false
    },
    selected : {
        type:String,
        required : false
    },
    variable: {
        type: mongoose.ObjectId,
        ref: "calculationVariable",
      },
})


export default mongoose.model("Calculation", Addvariable);
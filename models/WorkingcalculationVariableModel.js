import mongoose from "mongoose";

const WorkingvariableScheme = new mongoose.Schema({
    variable_name: {
        type: String,
        required: true,
    },
    VariableType: {
        type: String,
    },
    
    config_id: {
        type: String,
        required: true,
        //  unique : true,
    },
    test_total:{
        type:String
    },
    material_items: [
        {
            type: {
                type: String,
            },
            value: {
                type: String,
            },
            variable_name: {
                type: String,
            },
            VariableType: {
                type: String,
            },
            config_id: {
                type: String,
            },
            test_result: {
                type: String,
            },
        },
         
    ]
    
});

export default mongoose.model("WorkingcalculationVariable", WorkingvariableScheme);

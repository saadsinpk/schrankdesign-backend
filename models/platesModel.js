import mongoose from "mongoose";

const platesModel = new mongoose.Schema({
    images: {
        type: [String],
        required: [true, "images are Required"],
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    name: {
        type: String,
        required: true,
    },
    configId: {
        type: String,
        required: true,
    },
    plate_cost: {
        type: String,
        required: true,
    },
    price_increase: {
        type: String,
        required: true,
    },
    supplier_id: {
        type: String,
        required: true,
    },
    plate_length: {
        type: String,
        required: true,
    },
    plate_width: {
        type: String,
        required: true,
    },
    plate_thickness: {
        type: String,
        required: true,
    },

    plate_sort: {
        type: String,
        required: true,
    },
    BackP_Id_match: {
        type: String,
        required: true,
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
                }
            ],
            qty: [String],
            images: [String]
        }
    ]
    
});

export default mongoose.model("plates", platesModel);
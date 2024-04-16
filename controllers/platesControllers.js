import platesModel from "../models/platesModel.js";
import edgeModel from "../models/edgeModel.js";
import sendResponse from "../helpers/helper.js";

const PlatesControllers = {
    createplates: async (req, res) => {
        try {
            const {
                name,
                plate_cost,
                price_increase,
                supplier_id,
                plate_length,
                plate_width,
                plate_thickness,
                plate_sort,
                BackP_Id_match,
            } = req.body;
    
            // Find the next available ID
            let nextId = 1;
            const existingplates = await platesModel.find({}, { configId: 1 }, { sort: { 'configId': 1 } });
            const existingIds = existingplates.map((plate) => parseInt(plate.configId.slice(3), 10));
            while (existingIds.includes(nextId)) {
                nextId++;
            }
    
            const formattedCounter = nextId.toString().padStart(4, "0");
            const newplatesID = `PL_${formattedCounter}`;
    
            let result = new platesModel({
                images: req.files.map((file) => file.filename),
                name,
                configId: newplatesID,
                plate_cost,
                price_increase,
                supplier_id,
                plate_length,
                plate_width,
                plate_thickness,
                plate_sort,
                BackP_Id_match,
                // Add other fields as needed
            });
    
            // Save the new plate document
            await result.save();
    
            const plates = await platesModel.find();
            res.send(sendResponse(true, plates, "Created SuccessFully !!"));
        } catch (error) {
            console.log(error);
            if (error._message === "plates validation failed") {
                const errMsg = Object.values(error.errors)?.map(
                    (error) => error?.message
                );
                console.log(Object.values(error.errors));
                res.status(400).send(sendResponse(false, null, "Error", errMsg));
            } else {
                res
                    .status(500)
                    .send(sendResponse(false, null, "Internal Server Error"));
            }
        }
    },
    
    
    
    
    
    
    

    getplates: async (req, res) => {
        try {
            const plates = await platesModel.find();
            if (!plates) {
                return res.status(404).send(sendResponse(false, null, "No Data Found"));
            }
            
            const edges = await edgeModel.find();
    
            const enhancedPlates = plates.map(plate => {
                const matchingEdges = edges.filter(edge => edge.plate_Id_match === plate.configId);
                
                const edgeConfigIds = matchingEdges.map(edge => edge.configId);
                
                return {
                    ...plate.toObject(), // Convert Mongoose document to plain JavaScript object
                    edgeConfigIds: edgeConfigIds.length > 0 ? edgeConfigIds : "No matching edges"
                };
            });
    
            res.send(sendResponse(true, enhancedPlates, "Fetched Successfully"));
            
        } catch (e) {
            res.status(500).json({
                success: false,
                message: "Error in Fetching all Plates",
                err: err.message,
            });
        }
    },
    updateplates: async (req, res) => {
        let id = req.params.id;
        let result = await platesModel.findById(id);
        const {
            name,
            configId,
            plate_cost,
            price_increase,
            supplier_id,
            plate_length,
            plate_width,
            plate_thickness,
            plate_sort,
            BackP_Id_match,
        } = req.body;

        try {
            if (!result) {
                res.status(404).send(sendResponse(false, null, "Data not found"));
            } else {
                let update = {
                    name,
                    configId,
                    plate_cost,
                    price_increase,
                    supplier_id,
                    plate_length,
                    plate_width,
                    plate_thickness,
                    plate_sort,
                    BackP_Id_match,
                  };
          
                  if (req.files && req.files.length > 0) {
                    update.images = req.files.map((file) => file.filename);
                  } else {
                    update.images = result.images; // Use the existing images
                  }
                  // }
                  let plates = await platesModel.findByIdAndUpdate(id, update, {
                    new: true,
                  });

                if (plates) {
                    const Allplates = await platesModel.find();
                    res
                        .status(200)
                        .send(sendResponse(true, Allplates, "Updated Successfully"));
                } else {
                    res.status(400).send(sendResponse(false, null, "Update Failed"));
                }
            }
        } catch (e) {
            console.error(e);
            return res
                .status(500)
                .send(sendResponse(false, null, "Internal Server Error"));
        }
    },
    deleteplates: async (req, res) => {
        let id = req.params.id;
        let result = await platesModel.findById(id);
        try {
            if (!result) {
                res.send(sendResponse(false, null, "data not found")).status(404);
            } else {
                let del = await platesModel.findByIdAndDelete(id);
                if (!del) {
                    res.send(sendResponse(false, null, "Internal Error")).status(400);
                } else {
                    const Allplates = await platesModel.find();
                    res
                        .status(200)
                        .send(sendResponse(true, Allplates, "Deleted SuccessFully"));
                }
            }
        } catch (e) {
            console.log(e);
            return res
                .status(500)
                .send(sendResponse(false, null, "Internal Server Error"));
        }
    },
};

export default PlatesControllers;

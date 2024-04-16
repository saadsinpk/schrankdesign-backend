import express from "express";
import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import sendResponse from "../helpers/helper.js";
import platestypesModel from "../models/platesTypesModel.js";

import AssestsModel from "../models/Assests/AssestsModel.js";
import partListupload from "../Middle/Partlist.js";
import TestPartList from "../models/testPartListModel.js";
import platesModel from "../models/platesModel.js";
import platesTypesModel from "../models/platesTypesModel.js";
import PartlistModel from "../models/PartlistModel.js";
import edgeModel from "../models/edgeModel.js";

const testpartlistRouter = express.Router();

function calculateEdgeSize(edge_0, PlateDepth, PlateLength) {
    const edges = edge_0.split(""); // Split the string into individual characters
    let edgeSize = 0;
    // Parse PlateDepth and PlateLength to numbers
    const depth = parseInt(PlateDepth, 10);
    const length = parseInt(PlateLength, 10);

    edges.forEach(edge => {
        switch (edge) {
            case 'V': // Vertical edges
                edgeSize += length;
                break;
            case 'H': // Horizontal edges, corrected to add depth
                edgeSize += depth; 
                break;
            case 'L': // Left edge
                edgeSize += depth;
                break;
            case 'R': // Right edge
                edgeSize += depth;
                break;
            default:
                break;
        }
    });
    return edgeSize;
}

function updateQuantities(list, PlateDepth, PlateLength) {
    const depth = parseInt(PlateDepth, 10);
    const length = parseInt(PlateLength, 10);

    return list.map(item => {
        if (!item.add_distance) {
            return item; // If there's no add_distance, return the item as is.
        }
        let calculatedQuantity = 0; // Default to 0
        // Loop through each add_distance item
        item.add_distance.forEach(addDistance => {
            const from = parseInt(addDistance.functions_from[0], 10);
            const to = parseInt(addDistance.functions_to[0], 10);
            const distanceType = addDistance.functions_distance[0];
            const quantity = parseInt(addDistance.functions_quantity[0], 10);


            // Check distance type and update calculatedQuantity accordingly.
            if ((distanceType === 'Length' && length >= from && length <= to) ||
                (distanceType === 'Depth' && depth >= from && depth <= to)) {
                calculatedQuantity += quantity;
            }

        });
        // Update the quantity in the addDistance item
        return {
            ...item,
            qty: calculatedQuantity, // Convert quantity back to string if needed
        };

    });
}


testpartlistRouter.post('/CreateTestPartlist',verifyAdminToken, partListupload, async (req, res) => {
    try {
        const { configId, PlateDepth, PlateLength, MaterialName } = req.body;
        const models = [platestypesModel, AssestsModel];
        const existingconfigId = await TestPartList.find({ configId });

        let plateConfigId = "N/A";

        if(!configId.startsWith("A_")) {
            if (MaterialName == null || MaterialName === "") {
                return res.send(sendResponse(false, null, "Material Name must be provided and cannot be empty"));
            }

            if (PlateDepth == null || PlateDepth === "") {
                return res.send(sendResponse(false, null, "Plate Depth must be provided and cannot be empty"));
            }
            
            if (PlateLength == null || PlateLength === "") {
                return res.send(sendResponse(false, null, "Plate Length must be provided and cannot be empty"));
            }
        }

        // if (existingconfigId?.length > 0) {
        //     return res.send(sendResponse(false, null, "Config Id already exists"));
        // }

        if (!configId.startsWith("PT_") && !configId.startsWith("A_")) {
            return res.send(sendResponse(false, null, "Config Id must start with 'PT_' or 'A_'"));
        }
        const matchingPlate = await platesModel.findOne({ name: MaterialName });

        if (!matchingPlate && !configId.startsWith("A_")) { // Check if matchingPlate is null
            return res.send(sendResponse(false, null, "No matching plate found for the provided Material Name"));
        }
        
        let filteredPlatesData = [];
        const platesData = await getPlatesData();

        for (const model of models) {
            let testpartlist = await model?.findOne({ configId: configId });
            let edgeList = [];

            if (testpartlist) {
                const edgeSize = testpartlist.edge_0 ? calculateEdgeSize(testpartlist.edge_0, PlateDepth, PlateLength) : 0;
                if (matchingPlate) {
                    plateConfigId = matchingPlate.configId;
                    const matchingEdges = await edgeModel.find({ plate_Id_match: plateConfigId });

                    edgeList = matchingEdges.map(edge => ({
                        config_id: [],
                        child_name: [edge.name],
                        child_config_id: [edge.configId],
                        supplier_id: [edge.supplier_id],
                        functions: [],
                        edge_size: edgeSize,
                    }));
                }

                if (model === platestypesModel) {
                    const platestype = await platestypesModel.find({ configId });
                    platestype.forEach(pt => {
                        const matchingPlate = platesData.find(pd => pd.id === pt.name);
                        if (matchingPlate) {
                            filteredPlatesData.push(matchingPlate);
                        }
                    });
                }

                if (testpartlist.list && testpartlist.list.some(item => item.functions && item.functions.includes("Add-Distance"))) {
                    // Extract the 'add_distance' items and update their quantities
                    const addDistanceItems = testpartlist.list.filter(item => item.functions && item.functions.includes("Add-Distance"));
                    const updatedAddDistanceItems = updateQuantities(addDistanceItems.map(item => item.toObject()), PlateDepth, PlateLength);

                    const updatedList = testpartlist.list.map(item => {
                        const updatedItem = updatedAddDistanceItems.find(udi => udi._id.toString() === item._id.toString());
                        if (updatedItem) {
                            return Object.assign(item, updatedItem);
                        }
                        return item;
                    });


                    testpartlist.list = updatedList;
                }
                
                let result = new TestPartList({
                    name: testpartlist?.name,
                    configId: testpartlist?.configId,
                    config_0: testpartlist?.config_0,
                    PlateDepth: PlateDepth,
                    PlateLength: PlateLength,
                    MaterialName: MaterialName,
                    edge_0: testpartlist?.edge_0,
                    list: [...testpartlist.list, ...edgeList],
                    plateConfigId: plateConfigId,
                    platesData: filteredPlatesData.length > 0 ? filteredPlatesData : undefined,
                });

                if (testpartlist?.configId.includes("A_")) {
                    result.supplier_id = testpartlist?.supplier_id;
                    result.price_einkauf = testpartlist?.price_einkauf;
                    result.price_aufschlag = testpartlist?.price_aufschlag;
                    result.assetsType = testpartlist?.assetsType;
                }

                await result.save();
            }
        }

        const TestPartLists = await TestPartList.find();
        res.status(200).send(sendResponse(true, TestPartLists, "Created Successfully"));
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server error');
    }
});




testpartlistRouter.get("/getAllTestPartLists", verifyAdminToken,async (req,res)=>{
    try{
        const data = await TestPartList.find()
        const models = [platestypesModel, AssestsModel];
        
        if(data?.length == 0){
            return res.status(404).send(sendResponse(false , null, "Data Not Found"))
        }else{
            return res.status(200).send(sendResponse(true, data, "Data Fetched SuccessFully"))
        }
    }catch(e){
        console.log(e);
        return res.status(500).send(sendResponse(false, null, "Internal Server Error"))

    }
});
testpartlistRouter.delete("/deleteTestPartlist/:id",verifyAdminToken, async (req, res) => {
    let id = req.params.id;
    let result = await TestPartList.findById(id);
    try {
        if (!result) {
            return  res.status(404).send(sendResponse(false, null, "Data not found")).status(404);
        } else {
            let del = await TestPartList.findByIdAndDelete(id);
            if (!del) {
               return res.status(400).send(sendResponse(false, null, "Data not deleted")).status(400);
            } else {
                const TestPartLists = await TestPartList.find();
                res.status(200).send(sendResponse(true, TestPartLists, "Deleted successFully"));
            }
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send(sendResponse(false, null, "Internal Server Error"));
    }
});

testpartlistRouter.post("/searchConfigId", verifyAdminToken,partListupload, async (req, res) => {
    try {
        const { configId, type } = req.body;
        let assets, plates, platestype, filteredPlatesData = [];
        const platesData = await getPlatesData(); // Use the shared function to get platesData

        if (type === "asset") {
            assets = await AssestsModel.find({ configId });
        } else if (type === "plates") {
            platestype = await platesTypesModel.find({ configId });
            plates = await platesModel.find({ configId });

            // Filter platesData based on platestype names
            if (platestype && platestype.length > 0) {
                platestype.forEach(pt => {
                    const matchingPlate = platesData.find(pd => pd.id === pt.name);
                    if (matchingPlate) {
                        filteredPlatesData.push(matchingPlate);
                    }
                });
            }
        }
        let message = "Fetched successfully !!";
         
        if ((plates?.length === 0 && platestype?.length === 0) || assets?.length === 0) {
            message = "There is no such result for this config id";
            return res.status(404).send(sendResponse(false,null,"This config  id does not exist"));
        }
        platestype = platestype?.map(pt => {
            // Assuming you want to include all filteredPlatesData as a new property for each PlatesType
            return { ...pt._doc, FilteredPlates: filteredPlatesData };
        });
        
        res.send({
            Plates: plates,
            PlatesType: platestype,
            Assests: assets,
            Message: message
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
testpartlistRouter.put("/updateTestPartlist/:id",verifyAdminToken, partListupload, async (req, res) => {
    try {
        const { id } = req.params; // The ID of the parent document
        const { childrenData, ...parentUpdates } = req.body; // All the updated fields and children
        // Find the document by ID
        let testpartlist = await TestPartList.findById(id);
        if (!testpartlist) {
            return res.status(404).send(sendResponse(false, null, 'TestPartList not found.'));
        }
        // Update parent fields
        for (const [key, value] of Object.entries(parentUpdates)) {
            if (value) {
                testpartlist[key] = value;
            }
        }
        // Replace the childRow with the new childrenData
        if (childrenData) {
            // Clear the existing childRow
            testpartlist.childRow = [];

            // Push the new children data
            for (const child of childrenData) {
                testpartlist.childRow.push(child);
            }
        }
        // Save the changes to the database
        await testpartlist.save();
        const TestPartLists = await TestPartList.find();
        // Return the updated document
        res.status(200).send(sendResponse(true, TestPartLists, 'Updated Successfully'));
    } catch (err) {
        console.error(err);
        
        return res.status(500).send(sendResponse(false, null, "Internal Server Error"));
    }
});

async function getPlatesData() {
    // Simulating an asynchronous operation, e.g., fetching from a database
    return [
        {
            "color": "white",
            "type": "vertical",
            "id": "side-left",
            "length": 240,
            "depth": 60,
            "cutout": {
                "enable": false,
                "lenght": 4,
                "depth": 2.5
            }
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "side-middle-1",
            "length": 230.1,
            "depth": 60
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "side-middle-2",
            "length": 230.1,
            "depth": 60
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "side-middle-3",
            "length": 230.1,
            "depth": 60
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "side-right",
            "length": 240,
            "depth": 60,
            "cutout": {
                "enable": false,
                "lenght": 4,
                "depth": 2.5
            }
        },
        {
            "color": "white",
            "type": "horizontal",
            "id": "floor-top-1",
            "length": 47.6,
            "depth": 60
        },
        {
            "color": "white",
            "type": "horizontal",
            "id": "floor-top-2",
            "length": 47.6,
            "depth": 60
        },
        {
            "color": "white",
            "type": "horizontal",
            "id": "floor-top-3",
            "length": 47.6,
            "depth": 60
        },
        {
            "color": "white",
            "type": "horizontal",
            "id": "floor-top-4",
            "length": 47.6,
            "depth": 60
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "back-1",
            "length": 48.6,
            "depth": 229.2
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "back-2",
            "length": 48.6,
            "depth": 229.2
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "back-3",
            "length": 48.6,
            "depth": 229.2
        },
        {
            "color": "white",
            "type": "vertical",
            "id": "back-4",
            "length": 48.6,
            "depth": 229.2
        },
        {
            "color": "white",
            "type": "horizontal",
            "id": "floor-bottom",
            "length": 196.2,
            "depth": 60
        },
        {
            "color": "white",
            "type": "horizontal",
            "id": "plinth",
            "length": 196.2,
            "depth": 8
        },
    ];
}
testpartlistRouter.get("/getAllConfigure", async (req,res)=>{
    try{
        const platesData = await getPlatesData();
        res.status(200).send(sendResponse(true, platesData, 'Updated Successfully'));
    }catch(e){
        console.log(e);
        return res.status(500).send(sendResponse(false, null, "Internal Server Error"))

    }
});

export default testpartlistRouter
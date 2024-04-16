import express from "express";
import PartlistSchema from '../models/PartlistModel.js';
import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import sendResponse from "../helpers/helper.js";
import platestypesModel from "../models/platesTypesModel.js";

import AssestsModel from "../models/Assests/AssestsModel.js";
import partListupload from "../Middle/Partlist.js";
import TestPartLists from "../models/testPartListModel.js";

const partlistRouter = express.Router();


partlistRouter.post('/CreatePartlist', verifyAdminToken, partListupload, async (req, res) => {
    try {
        const { config_id, child_name, functions, qty, supplier_id } = req.body;
        const child_config_id = req.body.child_config_id || []; // Default to an empty array if undefined

        if (child_config_id.length === 0) {
            let updates = [];
            for (const model of [platestypesModel, AssestsModel]) {
                const item = await model.findOne({ configId: config_id });
                if (item) {
                    item.list = [];
                    const updatedItem = await item.save();
                    updates.push(updatedItem);
                }
            }
            if (updates.length > 0) {
                return res.status(200).json({
                    success: true,
                    data: updates,
                    message: 'Data updated successfully without child items in all relevant models.',
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Config ID not found in any model',
                });
            }
        } else {
                
            if (child_config_id.some(id => !id)) {
                return res.status(400).send({ success: false, message: "All child config IDs must be provided and non-empty.", errors: '' });
            }

            
            const models = [platestypesModel, AssestsModel];
            let modifiedData;
            let found = false;
            let return_error = false;
            const functions_distance = req.body.functions_distance || [[]];
            const functions_from = req.body.functions_from || [];
            const functions_quantity = req.body.functions_quantity || [];
            const functions_to = req.body.functions_to || [];
            if (child_config_id && child_config_id.length > 0) {
                child_config_id.forEach((configId, configIndex) => {
                    if (functions_distance[configIndex] && functions_distance[configIndex].length > 0) {
                        for (let i = 0; i < functions_distance[configIndex].length; i++) {
                            for (let j = i + 1; j < functions_distance[configIndex].length; j++) {
                                if (functions_distance[configIndex][i] === functions_distance[configIndex][j]) {
                                    const range1From = parseInt(functions_from[configIndex][i], 10);
                                    const range1To = parseInt(functions_to[configIndex][i], 10);
                                    const range2From = parseInt(functions_from[configIndex][j], 10);
                                    const range2To = parseInt(functions_to[configIndex][j], 10);
            
            
                                    if (isNaN(range1From) || isNaN(range1To) || isNaN(range2From) || isNaN(range2To)) {
                                        return_error = true;
                                    }
            
                                    if (range1From <= range2To && range2From <= range1To) {
                                        return_error = true;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            if(return_error == true) {
                return res.status(404).json({
                    success: false,
                    message: 'Overlapping distance ranges are not allowed.',
                });
            }
            
            const existedtestpartlist = await TestPartLists.find({ configId: config_id });
            for (const model of models) {
                const item = await model.findOne({ configId: config_id });

                if (item) {
                    const imageNames = req.body.images ? req.body.images : [];
                    console.log(imageNames);
                    
                    const updatesMap = child_config_id?.reduce((acc, configId, index) => {
                        acc[configId] = {
                            child_name: child_name[index],
                            child_config_id: configId,
                            supplier_id: supplier_id[index],
                            functions: functions[index],
                            qty: qty && qty[index],
                            images: imageNames[index] ? [imageNames[index]] : [], // Store image names directly
                            add_distance: functions_distance[index]?.map((distance, idx) => ({
                                functions_distance: distance,
                                functions_from: functions_from[index][idx],
                                functions_quantity: functions_quantity[index][idx],
                                functions_to: functions_to[index][idx],
                            })) || [],
                        };
                        return acc;
                    }, {});

                    const childConfigIdSet = new Set(child_config_id);
                    item.list = item.list.filter(existingItem => childConfigIdSet.has(existingItem.child_config_id))
                        .map(existingItem => {
                            if (updatesMap.hasOwnProperty(existingItem.child_config_id)) {
                                const update = updatesMap[existingItem.child_config_id];
                                delete updatesMap[existingItem.child_config_id];
                                return { ...existingItem, ...update };
                            }
                            return existingItem;
                        });

                    Object.values(updatesMap).forEach(newItem => {
                        item.list.push(newItem);
                    });

                    modifiedData = await item.save();
                    found = true;
                    break;
                }
            }

            if (!found) {
                return res.status(404).json({
                    success: false,
                    message: 'Config ID not found',
                });
            }
            
            if (existedtestpartlist?.length > 0) {
                for (const doc of existedtestpartlist) {
                    doc.list = [];
                    doc.list.push(...modifiedData?.list);
                    await doc.save();
                }
            }

            res.status(201).json({
                success: true,
                data: [modifiedData],
                message: 'Partlist created or updated successfully',
            });
        }
    } catch (error) {
        console.error(error);
        if (error._message === "PartList validation failed") {
            const errMsg = Object.values(error.errors).map(err => err.message);
            res.status(400).send({ success: false, message: "Error", errors: errMsg });
        } else {
            res.status(500).send({ success: false, message: "Internal Server Error" });
        }
    }
});



partlistRouter.post('/searchByConfigId',verifyAdminToken, partListupload, async (req, res) => {
    try {
        const { configId } = req.body;

        const platestypes = await platestypesModel.find({ configId });
        const assests = await AssestsModel.find({ configId });

        const assets = [
            ...assests
        ];
        res.send({
            Plates: platestypes,
            // Edge: edges,
            Assests: assets,
            Message: platestypes?.length === 0 && assets?.length === 0 ? "There Is No Such Result For This Config Id" : "Fetched SuccessFully !!"

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

partlistRouter.get("/getAllPartList",verifyAdminToken, async (req, res) => {
    try {
        const platestypes = await platestypesModel.find();
        const assets = await AssestsModel.find();


        const data = [
            ...platestypes,
            ...assets

        ];

        res.send({
            Data: data,

            Message: "Fetched SuccessFully !!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// partlistRouter.get('/Getpartlist', verifyAdminToken, async (req, res) => {
//     try {
//         const partLists = await PartlistSchema.find();
//         res.send(partLists);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
// partlistRouter.delete('/Deletepartlist/:id',verifyAdminToken, async (req, res) => {
//     const { id } = req.params;
//     try {
//         const result = await PartlistSchema.findByIdAndDelete(id);
//         // res.send(result)
//         if (result) {
//             console.log("delete")
//             res.send({ success: true, message: 'PartList deleted successfully' });
//         } else {
//             res.status(404).send({ success: false, message: 'PartList not found' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, error: 'Internal Server Error' });
//     }
// });
// partlistRouter.put("/updatepartlist/:id",verifyAdminToken, upload, async (req, res) => {
//     let id = req.params.id;
//     console.log(id)
//     let result = await PartlistSchema.findById(id);
//     const {  
//         name,
//         ConfigId,
//         supplier_id,
//         AddQty,
//         From,
//         To,
//         AddEdge
//      } = req.body;

//     try {
//         if (!result) {
//             res.status(404).send(sendResponse(false, null, "Data not found"));
//         } else {
//             let update = {};
//             if (
//                 'name' in req.body &&
//                 'ConfigId' in req.body &&
//              'supplier_id' in req.body &&
//               'AddQty' in req.body
//               && 'From' in req.body
//               && 'To' in req.body
//               && 'AddEdge' in req.body

//               ) {
//                 let arr=[]
//                 arr.push({
//                     AddQty: AddQty
//                 });
//                 arr.push({
//                     AddEdge: AddEdge
//                 });
//                 arr.push({
//                     From: From,
//                     To: To
//                 });

//                 update = {
//                     name,
//                     ConfigId,
//                     supplier_id,
//                     images: req.files.map((file) => file.filename),
//                     Action:arr
//                 };
//                 console.log("hello")
//             } else {
//                 res.status(400).send(sendResponse(false, null, "Invalid keys in the request body"));
//                 return;
//             }

//             let plates = await PartlistSchema.findByIdAndUpdate(id, update, { new: true });

//             if (plates) {
//                 res.status(200).send(sendResponse(true, plates, "Plates Updated Successfully"));
//             } else {
//                 res.status(400).send(sendResponse(false, null, "Update Failed"));
//             }
//         }
//     } catch (e) {
//         console.error(e);
//         return res.status(500).send(sendResponse(false, null, "Internal Server Error"));
//     }

// });

export default partlistRouter;
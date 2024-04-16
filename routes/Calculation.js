import express from "express";
import sendResponse from "../helpers/helper.js";
import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import Addvariable from "../models/AddVariable.js";
import calculationVariable from "../models/MaterialcalculationVariableModel.js";
import upload from "../Middle/Multer.js";

const CalculationRouter = express.Router();

CalculationRouter.post(
  "/CreateCalculation",
 // verifyAdminToken,
 upload,
  async (req, res) => {
    try {
      const { material_name, config_id, value, test_result, parent_config_id, var_type, selected } = req.body;
      let parent = await calculationVariable.findOne({config_id:parent_config_id});
       
      if(parent){
        if(config_id){
          
        let child = await calculationVariable.findOne({config_id:config_id});
        if(!child){

          return res.status(404).json({
            success : false,
            message : "Config ID not found, try again."
          });
        }
        }
      // Create a new Partlist document
      let newItemMaterial = {
        material_name,
        config_id,
        value,
        test_result,
        var_type,
        selected
      }
      const newCalculation = new Addvariable(newItemMaterial);
      const savedCalculation = await newCalculation.save();
      parent.material_items.push(savedCalculation._id);
      await parent.save();

      res.status(201).json({
        success: true,
        data: savedCalculation,
        message: "calculation created successfully",
      });
    }
    else {
      res.status(404).json({
        success : false,
        message : 'Parent Variable Not Found'
      })
    }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

CalculationRouter.get("/GetCalculation", 
//verifyAdminToken, 
async (req, res) => {
  try {
    const calculation = await Addvariable.find();
    res.send(sendResponse(true, calculation, "successfully fetch"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

CalculationRouter.delete(
  "/DeleteCalculation/:id",
   //verifyAdminToken,
  async (req, res) => {
    const { id } = req.params;
   
    try {
      const result = await Addvariable.findByIdAndDelete(id);
      // res.send(result)
      if (result) {
        res.send(sendResponse(true, result, " delete successfully"));
      } else {
        res.status(404).send({ success: false, message: "PartList not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
);

// Not needed this route for now..
CalculationRouter.put(
  "/updatecalculation/:id",
  verifyAdminToken,
  async (req, res) => {
    let id = req.params.id;
    // console.log(id)
    let result = await Addvariable.findById(id);
    const { MaterialName, ConfigId, value, TestResult } = req.body;

    try {
      if (!result) {
        res.status(404).send(sendResponse(false, null, "Data not found"));
      } else {
        let update = {};
        if (
          "MaterialName" in req.body &&
          "ConfigId" in req.body &&
          "value" in req.body &&
          "TestResult" in req.body
        ) {
          update = {
            MaterialName,
            ConfigId,
            value,
            TestResult,
          };
        } else {
          res
            .status(400)
            .send(
              sendResponse(false, null, "Invalid keys in the request body")
            );
          return;
        }

        let calculation = await Addvariable.findByIdAndUpdate(id, update, {
          new: true,
        });

        if (calculation) {
          res
            .status(200)
            .send(
              sendResponse(true, calculation, "Plates Updated Successfully")
            );
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
  }
);
export default CalculationRouter;

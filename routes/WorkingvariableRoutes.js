import express from "express";
import sendResponse from "../helpers/helper.js";
import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import WorkingvariableScheme from "../models/WorkingcalculationVariableModel.js";
import upload from "../Middle/Multer.js";

const WorkingCalculationRouter = express.Router();

function findSmallestMissingNumber(existingIds) {
  for (let i = 0; i < existingIds.length; i++) {
    // Since arrays are zero-indexed, the number we expect at index i is i + 1
    if (existingIds[i] !== i + 1) {
      return i + 1; // Return the missing number
    }
  }
  // If no gaps are found, return the next number after the last one in the array
  return existingIds.length + 1;
}

WorkingCalculationRouter.post(
  "/CreateWorkingVariable",
    verifyAdminToken,
  upload,
  async (req, res) => {
    try {
      const { variableName, ConfigId, test_total, VariableType } = req.body;
      let nextId = 1;
      let newvariableID; // Changed from `const newvariableID = 0;` to `let newvariableID;`
      if (VariableType == 'new_time') {
        const existingvariable = await WorkingvariableScheme.find(
          { config_id: /^WT_/ },
          { config_id: 1 },
          { sort: { config_id: 1 } }
        );
        
          const existingIds = existingvariable
          .map((variable) => parseInt(variable.config_id.slice(3), 10))
          .sort((a, b) => a - b); // Make sure to sort numerically
        nextId = findSmallestMissingNumber(existingIds);

        while (existingIds.includes(nextId)) {
          nextId++;
        }
        const formattedCounter = nextId.toString().padStart(4, "0");
        newvariableID = `WT_${formattedCounter}`; // This is now valid since newvariableID is declared with let
      } else {
        const existingvariable = await WorkingvariableScheme.find(
          { config_id: /^WP_/ },
          { config_id: 1 },
          { sort: { config_id: 1 } }
        );
        
          const existingIds = existingvariable
          .map((variable) => parseInt(variable.config_id.slice(3), 10))
          .sort((a, b) => a - b); // Make sure to sort numerically
        nextId = findSmallestMissingNumber(existingIds);

        while (existingIds.includes(nextId)) {
          nextId++;
        }
        const formattedCounter = nextId.toString().padStart(4, "0");
        newvariableID = `WP_${formattedCounter}`; // This is now valid as well
      }
      
      
      const newVariable = new WorkingvariableScheme({
        variable_name: variableName,
        VariableType: VariableType,
        config_id: newvariableID,
        test_total: "00",
      });
      const savedVariable = await newVariable.save();
      const allVariables = await WorkingvariableScheme.find();
      res.status(201).json({
        success: true,
        data: allVariables,
        message: "Variable created successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

WorkingCalculationRouter.post(
  "/addDataToWorkingVariable",
  verifyAdminToken,
  upload,
  async (req, res) => {
    try {
      const { variable_name, configId, material_items, test_total, VariableType } = req.body;
      const data = await WorkingvariableScheme.findOne({ config_id: configId });

      if (data == null || data?.length === 0) {
        return res
          .status(404)
          .send(sendResponse(false, null, "No such Variable found."));
      }
      if (!data.material_items || data.material_items.length === 0) {
        material_items?.forEach((item) => {
          if (item.type.includes("addvariable") || item.type.includes("addfunction")) {
            data?.material_items?.push({
              type: item?.type,
              variable_name: item?.variable_name,
              VariableType: item?.VariableType,
              config_id: item?.config_id,
              test_result: item?.test_result,
              // test_total: item?.test_total, // Include test_total here
            });
          } else {
            data?.material_items?.push({
              type: item?.type,
              value: item?.value,
              // test_total: item?.test_total, // Include test_total here
            });
          }
        });
      } else {
        data.material_items = [];
        material_items?.forEach((item) => {
          if (item.type.includes("addvariable") || item.type.includes("addfunction")) {
            data?.material_items?.push({
              type: item?.type,
              variable_name: item?.variable_name,
              VariableType: item?.VariableType,
              VariableType: item?.VariableType,
              config_id: item?.config_id,
              test_result: item?.test_result,
            });
          } else {
            data?.material_items?.push({
              type: item?.type,
              value: item?.value,
            });
          }
        });
      }
      // Add test_total to the main object
      data.test_total = test_total;

      const updatedVariable = await data.save();

      const allVariables = await WorkingvariableScheme.find();
      res.status(201).json({
        success: true,
        data: updatedVariable,
        message: "Created successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

WorkingCalculationRouter.post(
  "/searchByWorkingConfigid",
  upload,
  async (req, res) => {
    try {
      const { configId } = req.body;
      let searchConfigId = await WorkingvariableScheme.find({
        config_id: configId,
      });

      if (Array.isArray(searchConfigId) && searchConfigId?.length === 0) {
        return res
          .status(404)
          .send(sendResponse(false, null, "This config id does not exist"));
      }
      return res.send(sendResponse(true, searchConfigId));
      res.status(200).send({
        status: true,
        data: Array.isArray(searchConfigId) ? searchConfigId : null,
        Message: "Fetched successfully !!",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(sendResponse(false, null, "Internal Server Error"));
    }
  }
);

WorkingCalculationRouter.get("/dropIndexes", async (req, res) => {
  WorkingvariableScheme.collection.dropIndexes(function (err, result) {
    console.log("dropped successfully");
    res.end();
  });
});
WorkingCalculationRouter.get(
  "/generateConfigId",
  verifyAdminToken,
  async (req, res) => {
    let nextId = 1;
    const existingVariables = await WorkingvariableScheme.find(
      {},
      { config_id: 1 },
      { sort: { config_id: 1 } }
    );
    const existingIds = existingVariables.map((variable) =>
      parseInt(variable.config_id.slice(3), 10)
    );
    while (existingIds.includes(nextId)) {
      nextId++;
    }

    const formattedCounter = nextId.toString().padStart(4, "0");
    const newVariableId = `MT_${formattedCounter}`;
    res.send({ configId: newVariableId });
  }
);

WorkingCalculationRouter.get(
  "/getWorkingVariables",
  verifyAdminToken,
  async (req, res) => {
    try {
      const variables = await WorkingvariableScheme.find().populate(
        "material_items"
      );
      res.send(sendResponse(true, variables, "Successfully fetch"));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

WorkingCalculationRouter.delete(
  "/DeleteWorkingCalculation/:id",
  verifyAdminToken,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await WorkingvariableScheme.findByIdAndDelete(id);
      // res.send(result)
      if (result) {
        const allVariables = await WorkingvariableScheme.find();

        res.send(sendResponse(true, allVariables, " deleted successfully"));
      } else {
        res.status(404).send({ success: false, message: "Data not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
);

// Not needed this route for now..
WorkingCalculationRouter.put(
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
export default WorkingCalculationRouter;

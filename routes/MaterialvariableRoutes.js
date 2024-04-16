import express from "express";
import sendResponse from "../helpers/helper.js";
import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import calculationVariable from "../models/MaterialcalculationVariableModel.js";
import upload from "../Middle/Multer.js";

const CalculationRouter = express.Router();

CalculationRouter.post(
  "/CreateVariable",
    verifyAdminToken,
  upload,
  async (req, res) => {
    try {
      const { variableName, ConfigId, test_total } = req.body;
      console.log(variableName + " " + ConfigId);
      let nextId = 1;
      const existingvariable = await calculationVariable.find(
        {},
        { config_id: 1 },
        { sort: { config_id: 1 } }
      );
      const existingIds = existingvariable.map((plate) =>
        parseInt(plate.config_id.slice(3), 10)
      );
      while (existingIds.includes(nextId)) {
        nextId++;
      }
      const formattedCounter = nextId.toString().padStart(4, "0");
      const newvariableID = `MP_${formattedCounter}`;
      const newVariable = new calculationVariable({
        variable_name: variableName,
        config_id: newvariableID,
        test_total: "00",
      });
      const savedVariable = await newVariable.save();
      const allVariables = await calculationVariable.find();
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

CalculationRouter.post(
  "/addDataToVariable",
  verifyAdminToken,
  upload,
  async (req, res) => {
    try {
      const { variable_name, configId, material_items, test_total } = req.body;
      const data = await calculationVariable.findOne({ config_id: configId });

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

      const allVariables = await calculationVariable.find();
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

CalculationRouter.get("/dropIndexes", async (req, res) => {
  calculationVariable.collection.dropIndexes(function (err, result) {
    console.log("dropped successfully");
    res.end();
  });
});
CalculationRouter.get(
  "/generateConfigId",
  verifyAdminToken,
  async (req, res) => {
    let nextId = 1;
    const existingVariables = await calculationVariable.find(
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
CalculationRouter.post("/searchByConfigid", upload, async (req, res) => {
  try {
    const { configId } = req.body;
    let searchConfigId = await calculationVariable.find({
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
});

CalculationRouter.get(
  "/getVariables",
  verifyAdminToken,
  async (req, res) => {
    try {
      const variables = await calculationVariable
        .find()
        .populate("material_items");
      res.send(sendResponse(true, variables, "successfully fetch"));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

CalculationRouter.delete(
  "/DeleteCalculation/:id",
  verifyAdminToken,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await calculationVariable.findByIdAndDelete(id);
      // res.send(result)
      if (result) {
        const allVariables = await calculationVariable.find();

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

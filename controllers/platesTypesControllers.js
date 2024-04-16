import sendResponse from "../helpers/helper.js";
import platesTypesModel from "../models/platesTypesModel.js";

const platesTypesControllers = {
  createplatesTypes: async (req, res) => {
    try {
      const {
        name,
        configId,
        config_0,
        edge_0,
      } = req.body;
      let nextId = 1;
      const existingplates = await platesTypesModel.find({}, { configId: 1 }, { sort: { 'configId': 1 } });
      const existingIds = existingplates.map((plate) => parseInt(plate.configId.slice(3), 10));
      while (existingIds.includes(nextId)) {
        nextId++;
      }

      const formattedCounter = nextId.toString().padStart(4, "0");
      const newplatesID = `PT_${formattedCounter}`;

      const existingBooking = await platesTypesModel.findOne({ configId: newplatesID });
      if (existingBooking) {
        res.status(400).send({ Msg: 'Config ID already exists' });
      }
      let result = new platesTypesModel({
        name,
        configId: newplatesID,
        config_0,
        edge_0,
      });
      await result.save();
      const platesTypes = await platesTypesModel.find();
      res.send(sendResponse(true, platesTypes, "Created SuccessFully"));
    } catch (error) {
      console.log(error);
      if (error._message === "platesTypes validation failed") {
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
  getplatesTypes: async (req, res) => {
    try {
      const plates = await platesTypesModel.find();

      if (!plates) {
        res.send(sendResponse(false, null, "No Data Found")).status(404);
      } else {
        res.send(sendResponse(true, plates, "Fetched Sucessfully"));
      }
    } catch (e) {
      res.status(500).json({
        success: false,
        message: "Error in Fetching all Plates Types ",
        err: err.message,
      });
    }
  },
  updateplatestype: async (req, res) => {
    let id = req.params.id;
    let result = await platesTypesModel.findById(id);
    const {
      name,
      config_0,

      edge_0,

    } = req.body;

    try {
      if (!result) {
        res.status(404).send(sendResponse(false, null, "Data not found"));
      } else {

        // Check if the keys in the request body match the schema exactly
        // if ("name" in req.body && "config_0" in req.body && "config_1" in req.body) {
        let update = {
          name,
          config_0,

          edge_0,
        };

        // if (req.files && req.files.length > 0) {
        //   update.images = req.files.map((file) => file.filename);
        // } else {
        //   update.images = result.images; // Use the existing images
        // }
        // }
        let platestype = await platesTypesModel.findByIdAndUpdate(id, update, {
          new: true,
        });


        if (platestype) {
          const plates = await platesTypesModel.find();

          res.send(
            sendResponse(true, plates, "Plates Type Updated Successfully")
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
  },
  deleteplatesTypes: async (req, res) => {
    let id = req.params.id;
    let result = await platesTypesModel.findById(id);
    try {
      if (!result) {
        res.send(sendResponse(false, null, "data not found")).status(404);
      } else {
        let del = await platesTypesModel.findByIdAndDelete(id);
        if (!del) {
          res.send(sendResponse(false, null, "Internal Error")).status(400);
        } else {
          const plates = await platesTypesModel.find();

          res.send(
            sendResponse(true, plates, "Plates Type Deleted SuccessFully")
          );
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

export default platesTypesControllers;

import sendResponse from "../helpers/helper.js";
import edgeModel from "../models/edgeModel.js";
import platesModel from "../models/platesModel.js";

const EdgeControllers = {
  createEdge: async (req, res) => {
    try {
      const {
        name,
        configId,
        edge_cost,
        price_aufschlag,
        supplier_id,
        plate_Id_match,
        edge_width,
        edge_thickness,
        edge_type,
      } = req.body;
       
      const plateExists = await platesModel.findOne({ configId: plate_Id_match });
      if (!plateExists) {
          return res.status(400).send(sendResponse(false, null, "Plate Match ID does not exist"));
      }

      const edgeWithPlateMatch = await edgeModel.findOne({ plate_Id_match: plate_Id_match });
      if (edgeWithPlateMatch) {
          return res.status(400).send(sendResponse(false, null, "Plate Match ID is already used by another edge"));
      }

      let nextId = 1;
      const existingplates = await edgeModel.find({}, { configId: 1 }, { sort: { 'configId': 1 } });
      const existingIds = existingplates?.map((plate) => parseInt(plate.configId.slice(3), 10));
      while (existingIds.includes(nextId)) {
          nextId++;
      }
      const formattedCounter = nextId.toString().padStart(4, "0");
      const newEdgeID = `E_${formattedCounter}`;
      
      const existingBooking = await edgeModel.findOne({ configId: newEdgeID });
      if (existingBooking) {
          res.status(400).send({Msg:'Config ID already exists'});
      }
      
      let result = new edgeModel({
        images: req.files.map((file) => file.filename),
        name,
        configId: newEdgeID,
        edge_cost,
        price_aufschlag,
        supplier_id,
        plate_Id_match,
        edge_width,
        edge_thickness,
        edge_type,
      });
      await result.save();
      const Edge = await edgeModel.find();

      res.send(sendResponse(true, Edge, "Created SuccessFully"));
    } catch (error) {
      console.log(error);
      if (error._message === "Edge validation failed") {
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
  getEdges: async (req, res) => {
    try {
      const Edge = await edgeModel.find();

      if (!Edge) {
        res.send(sendResponse(false, null, "No Data Found")).status(404);
      } else {
        res.send(sendResponse(true, Edge, "Fetched Sucessfully"));
      }
    } catch (e) {
      res.status(500).json({
        success: false,
        message: "Error in Fetching all Edges",
        err: err.message,
      });
    }
  },
  updateEdge: async (req, res) => {
    let id = req.params.id;
    let result = await edgeModel.findById(id);
    const {
      name,
      configId,
      edge_cost,
      price_aufschlag,
      supplier_id,
      plate_Id_match,
      edge_width,
      edge_thickness,
      edge_type,
    } = req.body;

    try {
      if (!result) {
        res.status(404).send(sendResponse(false, null, "Data not found"));
      } else {
        const plateExists = await platesModel.findOne({ configId: plate_Id_match });
        if (!plateExists) {
            return res.status(400).send(sendResponse(false, null, "Plate Match ID does not exist"));
        }
        
        const edgeWithPlateMatch = await edgeModel.findOne({
          plate_Id_match: plate_Id_match,
          _id: { $ne: id } // Exclude the current edge from the search
        });
        if (edgeWithPlateMatch) {
            return res.status(400).send(sendResponse(false, null, "Plate Match ID is already used by another edge"));
        }

        let update = {};
        update = {
          name,
          configId,
          edge_cost,
          price_aufschlag,
          supplier_id,
          plate_Id_match,
          edge_width,
          edge_thickness,
          edge_type,
        };
        if (req.files && req.files.length > 0) {
          update.images = req.files.map((file) => file.filename);
        } else {
          update.images = result.images; // Use the existing images
        }
        let edge = await edgeModel.findByIdAndUpdate(id, update, { new: true });

        if (edge) {
          const Edge = await edgeModel.find();

          res.send(sendResponse(true, Edge, "Updated Successfully"));
        } else {
          res.status(400).send(sendResponse(false, null, "Edge Update Failed"));
        }
      }
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .send(sendResponse(false, null, "Internal Server Error"));
    }
  },
  deleteEdge: async (req, res) => {
    let id = req.params.id;
    let result = await edgeModel.findById(id);
    try {
      if (!result) {
        res.send(sendResponse(false, null, "data not found")).status(404);
      } else {
        let del = await edgeModel.findByIdAndDelete(id);
        if (!del) {
          res.send(sendResponse(false, null, "Internal Error")).status(400);
        } else {
          const Edges = await edgeModel.find();

          res.send(sendResponse(true, Edges, "Edge Deleted SuccessFully"));
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

export default EdgeControllers;
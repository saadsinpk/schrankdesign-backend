
import sendResponse from "../../helpers/helper.js";
import AssestsModel from "../../models/Assests/AssestsModel.js";
const feetControllers ={
    createfeet:async (req, res) => {
        try {
          const {
            name,
            configId,
            supplier_id,
            price_einkauf,
            price_aufschlag,
            price_verkauf,
            profit_pro_pcs,
            assetsType,
          } = req.body;

          let nextId = 1;
          const existingplates = await AssestsModel.find({}, { configId: 1 }, { sort: { 'configId': 1 } });
          const existingIds = existingplates.map((plate) => parseInt(plate.configId.slice(3), 10));
          while (existingIds.includes(nextId)) {
              nextId++;
          }
          const formattedCounter = nextId.toString().padStart(4, "0");
          const newfeetID = `A_${formattedCounter}`;
          
          const existingBooking = await AssestsModel.findOne({ configId: newfeetID });
          if (existingBooking) {
              res.status(400).send({Msg:'Config ID already exists'});
          }
          let result = new AssestsModel({
            images: req.files.map((file) => file.filename),
            name,
            configId: newfeetID,
            supplier_id,
            price_einkauf,
            price_aufschlag,
            price_verkauf,
            profit_pro_pcs,
            assetsType:"Feet"
          });
          await result.save();
          const feets = await AssestsModel.find();
          const assetsTypes = feets.filter((x)=> x.assetsType === "Feet");
          res.send(sendResponse(true, assetsTypes, "Created SuccessFully"));
        } catch (error) {
          console.log(error);
          if (error._message === "feet validation failed") {
            const errMsg = Object.values(error.errors)?.map(
              (error) => error?.message
            );
            console.log(Object.values(error.errors));
            res.status(400).send(sendResponse(false, null, "Error", errMsg));
          } else {
            res.status(500).send(sendResponse(false, null, "Internal Server Error"));
          }
        }
      },
      getfeet:async (req, res) => {
        try {
          const feets = await AssestsModel.find();
      
          if (!feets) {
            res.send(sendResponse(false, null, "No Data Found")).status(404);
          } else {
          const assetsTypes = feets.filter((x)=> x.assetsType === "Feet");

            res.send(sendResponse(true, assetsTypes, "Fetched Sucessfully"));
          }
        } catch (e) {
          res.status(500).json({
            success: false,
            message: "Error in Fetching all Feets",
            err: err.message,
          });
        }
      },
      updatefeet:async (req, res) => {
        let id = req.params.id;
        let result = await AssestsModel.findById(id);
        const {
          name,
          configId,
          supplier_id,
          price_einkauf,
          price_aufschlag,
          price_verkauf,
          profit_pro_pcs,
        } = req.body;
      
        try {
          if (!result) {
            res.status(404).send(sendResponse(false, null, "Data not found"));
          } else {
            let update = {};
               
            update = {
              name,
              configId,
              supplier_id,
              price_einkauf,
              price_aufschlag,
              price_verkauf,
              profit_pro_pcs,
            };
            if (req.files && req.files.length > 0) {
              update.images = req.files.map((file) => file.filename);
            } else {
              update.images = result.images; // Use the existing images
            }
            
            let feets = await AssestsModel.findByIdAndUpdate(id, update, {
              new: true,
            });
      
            if (feets) {
              const feetss = await AssestsModel.find();
              const assetsTypes = feetss.filter((x)=> x.assetsType === "Feet");
      
              res.send(sendResponse(true, assetsTypes, "Updated Successfully"));
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
      deletefeet:async (req, res) => {
        let id = req.params.id;
        let result = await AssestsModel.findById(id);
        try {
          if (!result) {
            res.send(sendResponse(false, null, "Data not found")).status(404);
          } else {
            let del = await AssestsModel.findByIdAndDelete(id);
            if (!del) {
              res.send(sendResponse(false, null, "Internal Error")).status(400);
            } else {
              const feet = await AssestsModel.find();
              const assetsTypes = feet.filter((x)=> x.assetsType === "Feet");

              res.send(sendResponse(true, assetsTypes, "Deleted SuccessFully"));
            }
          }
        } catch (e) {
          console.log(e);
          res.status(500).json({
            success: false,
            message: "Error in Delete Drawer",
            err: err.message,
          });
        }
      }
}

export default feetControllers;
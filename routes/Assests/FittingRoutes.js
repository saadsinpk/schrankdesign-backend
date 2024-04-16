import express from "express";
import upload from "../../Middle/Multer.js";
import { verifyAdminToken } from "../../middelwares/Tokenverification.js";
import fittingControllers from "../../controllers/Assets/fittingsControllers.js";


const route = express.Router();

route.post("/createfitting",  upload, fittingControllers.createfitting );

route.get("/getfitting", verifyAdminToken, fittingControllers.getfitting );

route.put("/updatefitting/:id",verifyAdminToken, upload, fittingControllers.updatefitting );

route.delete("/deletefitting/:id",verifyAdminToken, fittingControllers.deletefitting);

export default route;
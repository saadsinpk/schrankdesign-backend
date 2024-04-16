import express from "express";
import upload from "../../Middle/Multer.js";
import { verifyAdminToken } from "../../middelwares/Tokenverification.js";
import handleControllers from "../../controllers/Assets/handleContollers.js";


const route = express.Router();

route.post("/createhandle",verifyAdminToken,  upload, handleControllers.createhandle );

route.get("/gethandle", verifyAdminToken, handleControllers.gethandle );

route.put("/updatehandle/:id",verifyAdminToken, upload, handleControllers.updatehandle );

route.delete("/deletehandle/:id",verifyAdminToken, handleControllers.deletehandle);

export default route;

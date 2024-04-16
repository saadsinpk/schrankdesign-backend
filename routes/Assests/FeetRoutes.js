import express from "express";
import upload from "../../Middle/Multer.js";
import { verifyAdminToken } from "../../middelwares/Tokenverification.js";
import feetControllers from "../../controllers/Assets/feetControllers.js";


const route = express.Router();

route.post("/createfeet", verifyAdminToken, upload, feetControllers.createfeet );
route.get("/getfeet", verifyAdminToken, feetControllers.getfeet );
route.put("/updatefeet/:id",verifyAdminToken, upload, feetControllers.updatefeet );
route.delete("/deletefeet/:id",verifyAdminToken, feetControllers.deletefeet);

export default route;

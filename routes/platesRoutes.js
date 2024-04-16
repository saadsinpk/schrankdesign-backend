import express from "express";
import upload from "../Middle/Multer.js";
import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import PlatesControllers from "../controllers/platesControllers.js";


const route = express.Router();

route.post("/createplates",verifyAdminToken,  upload, PlatesControllers.createplates);
route.get("/getplates", verifyAdminToken, PlatesControllers.getplates);
route.put("/updateplates/:id",verifyAdminToken,  upload, PlatesControllers.updateplates);
route.delete("/deleteplates/:id",verifyAdminToken,   PlatesControllers.deleteplates);

export default route;
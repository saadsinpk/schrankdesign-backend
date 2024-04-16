import express from "express";
import upload from "../../Middle/Multer.js";
import { verifyAdminToken } from "../../middelwares/Tokenverification.js";
import DoorsControllers from "../../controllers/Assets/doorsControllers.js";


const route = express.Router();

route.post("/createDoors", verifyAdminToken, upload,DoorsControllers.createDoors );

route.get("/getDoors", verifyAdminToken,DoorsControllers.getDoors );

route.put("/updateDoors/:id",verifyAdminToken, upload,DoorsControllers.updateDoors );

route.delete("/deleteDoors/:id",verifyAdminToken,DoorsControllers.deleteDoors);

export default route;

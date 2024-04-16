import express from "express";
import upload from "../Middle/Multer.js";

import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import EdgeControllers from "../controllers/edgeController.js";
const route = express.Router();

route.post("/createEdge", verifyAdminToken, upload, EdgeControllers.createEdge);
route.get("/getEdges", verifyAdminToken, EdgeControllers.getEdges);
route.put("/updateEdge/:id",verifyAdminToken,  upload, EdgeControllers.updateEdge );
route.delete("/deleteEdge/:id", verifyAdminToken, EdgeControllers.deleteEdge );

export default route;
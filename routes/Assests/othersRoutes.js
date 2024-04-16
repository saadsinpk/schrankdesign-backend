import express from "express";
import upload from "../../Middle/Multer.js";
import { verifyAdminToken } from "../../middelwares/Tokenverification.js";
import othersControllers from "../../controllers/Assets/othersControllers.js";


const route = express.Router();

route.post("/createothers",verifyAdminToken,   upload, othersControllers.createothers );

route.get("/getothers",  verifyAdminToken ,othersControllers.getothers );

route.put("/updateothers/:id",verifyAdminToken, upload, othersControllers.updateothers );

route.delete("/deleteothers/:id",verifyAdminToken, othersControllers.deleteothers);

export default route;
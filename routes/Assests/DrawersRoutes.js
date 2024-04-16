import express from "express";
import upload from "../../Middle/Multer.js";
import {  verifyAdminToken  } from "../../middelwares/Tokenverification.js";
import DrawerControllers from "../../controllers/Assets/drawersController.js";


const route = express.Router();

route.post("/createDrawers",verifyAdminToken,upload,DrawerControllers.createDrawers);
route.get("/getDrawers",  verifyAdminToken , DrawerControllers.getDrawers );
route.put("/updateDrawers/:id", verifyAdminToken , upload, DrawerControllers.updateDrawers );
route.delete("/deleteDrawers/:id", verifyAdminToken , DrawerControllers.deleteDrawers);

export default route;

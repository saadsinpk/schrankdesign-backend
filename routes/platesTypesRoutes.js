import express from "express";
import upload from "../Middle/Multer.js";

import { verifyAdminToken } from "../middelwares/Tokenverification.js";
import platesTypesControllers from "../controllers/platesTypesControllers.js";

const route = express.Router();

route.post(
  "/createplatesTypes",
  verifyAdminToken,
  upload,
  platesTypesControllers.createplatesTypes
);

route.get(
  "/getplatesTypes",verifyAdminToken,
  platesTypesControllers.getplatesTypes
);

route.put(
  "/updateplatesTypes/:id",
  upload,verifyAdminToken,
  platesTypesControllers.updateplatestype
);

route.delete(
  "/deleteplatesTypes/:id",
  verifyAdminToken,
  platesTypesControllers.deleteplatesTypes
);

export default route;

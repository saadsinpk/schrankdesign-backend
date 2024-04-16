import express from "express";
import {
  getOrdersController,
  getSingleOrderController,
  getSingleUserOrderController,
  getUserOrdersController,
} from "../controllers/orderController.js";

import { verifyAdminToken, verifyUserToken, verifyUserAvailable } from "../middelwares/Tokenverification.js";

// router object
const router = express.Router();

// CREATE PRODUCT || POST

// GET ORDERS || GET
router.get("/get-orders", verifyAdminToken, getOrdersController);

// GET SINGLE ORDER || GET
router.get("/get-order/:id", verifyAdminToken, getSingleOrderController);

// GET SINGLE ORDER || GET
router.get("/get-user-order", verifyUserAvailable, getUserOrdersController);

// GET SINGLE ORDER || GET
router.get(
  "/get-user-order/:id",
  verifyUserToken,
  getSingleUserOrderController
);

// ----------------------------------------------------------------------------------------

export default router;

import express from "express";
import {
  CreateAnOrder,
  CaptureAnOrder,
} from "../controllers/payPalPaymentController.js";

const router = express.Router();

router.post("/api/orders", CreateAnOrder);

router.post("/api/orders/:orderID/capture", CaptureAnOrder);

export default router;

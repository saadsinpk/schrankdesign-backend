import express from "express";
import {
  initiatePayment,
  // CreateOrder,
  // getCheckoutSnippet,
  // readOrder,
  // renderConfirmationPage,
} from "../controllers/KlarnaPaymentController.js";

const router = express.Router();

router.post("/initiate-payment", initiatePayment);

// router.post("/create-order", CreateOrder);
// router.get("/get-checkout-snippet/:orderId", getCheckoutSnippet);
// router.get("/read-order/:orderId", readOrder);
// router.get("/confirmation-page/:orderId", renderConfirmationPage);

export default router;

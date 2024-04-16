import express from "express";
import {
  AdminProfileUpdateController,
  adminSingleUserController,
  allUsersController,
  deleteUsersController,
  forgotPasswordController,
  loginController,
  profileUpdateController,
  registerController,
  singleUserController,
  testController,
} from "../controllers/authController.js";
import formidable from "express-formidable";

import { verifyAdminToken, verifyUserToken, verifyUserAvailable } from "../middelwares/Tokenverification.js";

// router object
const router = express.Router();

//routing

// REGISTER || POST
router.post("/register", formidable(), registerController);

// LOGIN || POST
router.post("/login", loginController);

//FORGOT PASSWORD || POST
router.post("/forgot-password", forgotPasswordController);

//test routes
router.get("/test", verifyAdminToken, testController);

// SINGLE || GET
router.get("/single-user", verifyUserAvailable, singleUserController);

// SINGLE || GET
router.get(
  "/admin-single-user/:id",
  verifyAdminToken,
  adminSingleUserController
);

// SINGLE || GET
router.put(
  "/admin-update-user/:id",
  verifyAdminToken,
  formidable(),
  AdminProfileUpdateController
);

//profile update
router.put("/profile", verifyUserAvailable, formidable(), profileUpdateController);

//All Users
router.get("/get-all",verifyAdminToken, allUsersController);

//delete User
router.delete("/delete/:id", verifyAdminToken, deleteUsersController);

//protected route auth for user
router.get("/user-auth",verifyUserToken, (req, res) => {
  res.status(200).send({ ok: true });
});

//protected route auth for admin
router.get("/admin-auth", verifyAdminToken, (req, res) => {
  res.status(200).send({ ok: true });
});

export default router;

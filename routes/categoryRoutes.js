import express from "express"
import {
  categoryController,
  createCategoryController,
  deleteCategoryController,
  singleCategoryController,
  updateCategoryController,
} from "../controllers/categoryController.js"
import formidable from "express-formidable"
import { verifyAdminToken } from "../middelwares/Tokenverification.js"

// router object
const router = express.Router()

//routing

// CREATE CATEGORY || POST
router.post(
  "/create-category",
  verifyAdminToken,
  formidable(),
  createCategoryController
)

// UPDATE CATEGORY || PUT
router.put(
  "/update-category/:id",
  verifyAdminToken,
  formidable(),
  updateCategoryController
)

// GET ALL CATEGORY || GET
router.get("/categories", categoryController)

// GET SINGLE CATEGORY || GET
router.get("/single-category/:id", singleCategoryController)

// DELETE CATEGORY || DELETE
router.delete(
  "/delete-category/:id",
  verifyAdminToken,
  deleteCategoryController
)

export default router

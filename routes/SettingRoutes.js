import express from "express"
import { getAllSettingsController, updateOneSettingController } from "../controllers/settingsController.js"
import { verifyAdminToken } from "../middelwares/Tokenverification.js"

// router object
const router = express.Router()

// get all calculation info
router.get("/getAll", verifyAdminToken, getAllSettingsController)
router.post("/updateone", verifyAdminToken, updateOneSettingController)

export default router

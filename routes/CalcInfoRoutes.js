import express from "express"
import { getCalcInfoController } from "../controllers/calcInfoController.js"

// router object
const router = express.Router()

// get all calculation info
router.post("/infos", getCalcInfoController)

export default router

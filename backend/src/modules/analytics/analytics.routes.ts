import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import * as analyticsController from "./analytics.controller"

const router = Router()
router.use(authenticate)
router.get("/", analyticsController.get)

export default router

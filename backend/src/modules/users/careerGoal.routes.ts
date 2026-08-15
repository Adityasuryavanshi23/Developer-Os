import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import * as careerGoalController from "./careerGoal.controller"

const router = Router()

// All career goal routes require a logged-in user
router.use(authenticate)

router.get("/", careerGoalController.get)
router.put("/", careerGoalController.upsert)   // PUT = create or update
router.delete("/", careerGoalController.remove)

export default router

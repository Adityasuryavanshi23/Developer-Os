import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import * as taskController from "./task.controller"

const router = Router()

router.use(authenticate)

router.get("/today", taskController.getToday)
router.get("/", taskController.getAll)
router.post("/", taskController.create)
router.patch("/:id", taskController.update)
router.post("/:id/complete", taskController.complete)
router.post("/:id/reschedule", taskController.reschedule)
router.delete("/:id", taskController.remove)

export default router

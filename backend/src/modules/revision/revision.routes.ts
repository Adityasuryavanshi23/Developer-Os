import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import * as revisionController from "./revision.controller"

const router = Router()
router.use(authenticate)

router.get("/",          revisionController.getAll)
router.get("/today",     revisionController.getToday)
router.get("/due",       revisionController.getDue)
router.post("/",         revisionController.create)
router.post("/schedule", revisionController.scheduleForTopic)
router.post("/:id/complete", revisionController.complete)
router.post("/:id/skip",     revisionController.skip)
router.delete("/:id",        revisionController.remove)

export default router

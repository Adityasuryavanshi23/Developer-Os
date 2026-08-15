import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import * as skillController from "./skill.controller"
import * as topicController from "./topic.controller"

const router = Router()

router.use(authenticate)

// ─── Skills ───────────────────────────────────────────────────────────────────
router.get("/skills", skillController.getAll)
router.post("/skills", skillController.create)
router.patch("/skills/:id", skillController.update)
router.delete("/skills/:id", skillController.remove)

// ─── Topics ───────────────────────────────────────────────────────────────────
router.get("/topics", topicController.getAll)
router.get("/topics/skill/:skillId", topicController.getBySkill)
router.post("/topics", topicController.create)
router.patch("/topics/:id", topicController.update)
router.delete("/topics/:id", topicController.remove)

export default router

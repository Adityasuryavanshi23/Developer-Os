import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import * as c from "./interview.controller"

const router = Router()
router.use(authenticate)

// Questions
router.get("/questions",                c.getQuestions)
router.post("/questions",               c.createQuestion)
router.delete("/questions/:id",         c.deleteQuestion)

// Attempts
router.get("/attempts",                 c.getMyAttempts)
router.post("/questions/:id/attempt",   c.submitAttempt)
router.get("/questions/:id/attempts",   c.getAttemptsByQuestion)
router.delete("/attempts/:id",          c.deleteAttempt)

export default router

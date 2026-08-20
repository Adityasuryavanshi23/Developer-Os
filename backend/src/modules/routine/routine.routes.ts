import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import * as routineController from "./routine.controller"

const router = Router()

// All routine routes require a logged-in user
router.use(authenticate)

// ── Routine ───────────────────────────────────────────────────────────────────
router.get("/",       routineController.getMyRoutine)    // GET  /routine
router.post("/",      routineController.createMyRoutine) // POST /routine
router.patch("/",     routineController.updateMyRoutine) // PATCH /routine

// ── Setup Wizard (one-shot: creates routine + all activities) ─────────────────
router.post("/setup", routineController.setupWizard)     // POST /routine/setup

// ── Activities ────────────────────────────────────────────────────────────────
router.post("/activities",      routineController.addActivity)    // POST   /routine/activities
router.patch("/activities/:id", routineController.updateActivity) // PATCH  /routine/activities/:id
router.delete("/activities/:id", routineController.deleteActivity) // DELETE /routine/activities/:id

// ── Today's view ──────────────────────────────────────────────────────────────
router.get("/today", routineController.getToday) // GET /routine/today

// ── Completion Actions ────────────────────────────────────────────────────────
router.post("/activities/:id/done",    routineController.completeDone)   // POST /routine/activities/:id/done
router.post("/activities/:id/skip",    routineController.completeSkip)   // POST /routine/activities/:id/skip
router.post("/activities/:id/missed",  routineController.completeMiss)   // POST /routine/activities/:id/missed
router.post("/activities/:id/revert",  routineController.completeRevert) // POST /routine/activities/:id/revert

// ── Streak & Analytics ────────────────────────────────────────────────────────
router.get("/streak",    routineController.getStreak)    // GET /routine/streak
router.get("/analytics", routineController.getAnalytics) // GET /routine/analytics?days=30

export default router

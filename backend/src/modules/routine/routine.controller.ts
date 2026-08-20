import { Request, Response, NextFunction } from "express"
import {
  createRoutineSchema,
  createActivitySchema,
  updateActivitySchema,
  bulkCreateActivitiesSchema,
  completionActionSchema,
} from "./routine.schema"
import * as routineService from "./routine.service"

// ── Routine ───────────────────────────────────────────────────────────────────

export async function getMyRoutine(req: Request, res: Response, next: NextFunction) {
  try {
    const routine = await routineService.getRoutine(req.userId)
    res.json({ success: true, data: routine })
  } catch (err) { next(err) }
}

export async function createMyRoutine(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createRoutineSchema.parse(req.body)
    const routine = await routineService.createRoutine(req.userId, input)
    res.status(201).json({ success: true, message: "Routine created", data: routine })
  } catch (err) { next(err) }
}

export async function updateMyRoutine(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createRoutineSchema.partial().parse(req.body)
    const routine = await routineService.updateRoutine(req.userId, input)
    res.json({ success: true, message: "Routine updated", data: routine })
  } catch (err) { next(err) }
}

// ── Setup Wizard (final step — create routine + all activities at once) ───────

export async function setupWizard(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, timezone, activities } = bulkCreateActivitiesSchema
      .extend({
        name:     createRoutineSchema.shape.name,
        timezone: createRoutineSchema.shape.timezone,
      })
      .parse(req.body)

    const routine = await routineService.setupRoutine(
      req.userId,
      { name, timezone },
      activities
    )
    res.status(201).json({ success: true, message: "Routine setup complete", data: routine })
  } catch (err) { next(err) }
}

// ── Activities ────────────────────────────────────────────────────────────────

export async function addActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createActivitySchema.parse(req.body)
    const activity = await routineService.addActivity(req.userId, input)
    res.status(201).json({ success: true, message: "Activity added", data: activity })
  } catch (err) { next(err) }
}

export async function updateActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateActivitySchema.parse(req.body)
    const activity = await routineService.updateActivity(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Activity updated", data: activity })
  } catch (err) { next(err) }
}

export async function deleteActivity(req: Request, res: Response, next: NextFunction) {
  try {
    await routineService.deleteActivity(req.userId, req.params.id as string)
    res.json({ success: true, message: "Activity removed" })
  } catch (err) { next(err) }
}

// ── Today ─────────────────────────────────────────────────────────────────────

export async function getToday(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await routineService.getTodayRoutine(req.userId)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

// ── Completion Actions ────────────────────────────────────────────────────────

export async function completeDone(req: Request, res: Response, next: NextFunction) {
  try {
    const input = completionActionSchema.parse(req.body)
    const result = await routineService.markDone(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Marked as done", data: result })
  } catch (err) { next(err) }
}

export async function completeSkip(req: Request, res: Response, next: NextFunction) {
  try {
    const input = completionActionSchema.parse(req.body)
    const result = await routineService.markSkipped(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Marked as skipped", data: result })
  } catch (err) { next(err) }
}

export async function completeMiss(req: Request, res: Response, next: NextFunction) {
  try {
    const input = completionActionSchema.parse(req.body)
    const result = await routineService.markMissed(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Marked as missed", data: result })
  } catch (err) { next(err) }
}

export async function completeRevert(req: Request, res: Response, next: NextFunction) {
  try {
    const input = completionActionSchema.parse(req.body)
    const result = await routineService.markPending(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Reverted to pending", data: result })
  } catch (err) { next(err) }
}

// ── Streak ────────────────────────────────────────────────────────────────────

export async function getStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const streak = await routineService.getStreak(req.userId)
    res.json({ success: true, data: streak })
  } catch (err) { next(err) }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Number(req.query.days) || 30
    const data = await routineService.getRoutineAnalytics(req.userId, days)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

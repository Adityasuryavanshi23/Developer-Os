import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type {
  CreateRoutineInput,
  CreateActivityInput,
  UpdateActivityInput,
  BulkCreateInput,
  CompletionActionInput,
} from "./routine.schema"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a "YYYY-MM-DD" string to a Date object at midnight UTC.
 * We store dates as midnight-UTC so comparisons are timezone-safe.
 */
function dateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}

/**
 * Get today's date string in "YYYY-MM-DD" for the Asia/Kolkata timezone.
 * This ensures "today" is always IST, not UTC.
 */
function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
}

/**
 * Return the day abbreviation for a given date e.g. "MON", "TUE" …
 */
function dayAbbr(date: Date, tz = "Asia/Kolkata"): string {
  return date
    .toLocaleDateString("en-US", { weekday: "short", timeZone: tz })
    .toUpperCase()
    .slice(0, 3)
}

// ── Routine CRUD ──────────────────────────────────────────────────────────────

/**
 * Get the user's active routine (with all active activities).
 * Returns null if the user has never created a routine.
 */
export async function getRoutine(userId: string) {
  return prisma.routine.findFirst({
    where: { userId, active: true },
    include: {
      activities: {
        where: { active: true },
        orderBy: [{ startTime: "asc" }],
      },
    },
  })
}

/**
 * Create a brand-new routine for the user.
 * A user should only have one active routine at a time — we enforce this here.
 */
export async function createRoutine(userId: string, input: CreateRoutineInput) {
  // If the user already has an active routine, return it (don't create a duplicate)
  const existing = await prisma.routine.findFirst({ where: { userId, active: true } })
  if (existing) return existing

  return prisma.routine.create({
    data: { userId, name: input.name, timezone: input.timezone },
  })
}

/**
 * Update the routine's name or timezone.
 */
export async function updateRoutine(userId: string, input: Partial<CreateRoutineInput>) {
  const routine = await prisma.routine.findFirst({ where: { userId, active: true } })
  if (!routine) throw new AppError("Routine not found", 404)

  return prisma.routine.update({
    where: { id: routine.id },
    data: input,
  })
}

// ── Activity CRUD ─────────────────────────────────────────────────────────────

/**
 * Add a single activity to the user's active routine.
 */
export async function addActivity(userId: string, input: CreateActivityInput) {
  const routine = await prisma.routine.findFirst({ where: { userId, active: true } })
  if (!routine) throw new AppError("Create a routine first", 400)

  return prisma.routineActivity.create({
    data: {
      routineId:  routine.id,
      name:       input.name,
      category:   input.category,
      startTime:  input.startTime,
      endTime:    input.endTime,
      repeatDays: input.repeatDays,
      type:       input.type,
      priority:   input.priority,
      goalNote:   input.goalNote,
    },
  })
}

/**
 * Wizard final step — create the routine + all activities in one transaction.
 * Safe to call even if routine already exists (idempotent).
 */
export async function setupRoutine(
  userId: string,
  routineInput: CreateRoutineInput,
  activities: BulkCreateInput["activities"]
) {
  // Get or create the routine
  let routine = await prisma.routine.findFirst({ where: { userId, active: true } })
  if (!routine) {
    routine = await prisma.routine.create({
      data: { userId, name: routineInput.name, timezone: routineInput.timezone },
    })
  }

  // Delete old activities so wizard can be rerun cleanly
  await prisma.routineActivity.deleteMany({ where: { routineId: routine.id } })

  // Bulk insert all new activities
  await prisma.routineActivity.createMany({
    data: activities.map((a) => ({
      routineId:  routine.id,
      name:       a.name,
      category:   a.category,
      startTime:  a.startTime,
      endTime:    a.endTime,
      repeatDays: a.repeatDays,
      type:       a.type,
      priority:   a.priority,
      goalNote:   a.goalNote,
    })),
  })

  // Return the full routine with activities
  return prisma.routine.findUnique({
    where: { id: routine.id },
    include: { activities: { where: { active: true }, orderBy: { startTime: "asc" } } },
  })
}

/**
 * Update an existing activity (name, time, days, category, etc.)
 */
export async function updateActivity(
  userId: string,
  activityId: string,
  input: UpdateActivityInput
) {
  // Verify the activity belongs to this user via the routine
  const activity = await prisma.routineActivity.findFirst({
    where: { id: activityId, routine: { userId } },
  })
  if (!activity) throw new AppError("Activity not found", 404)

  return prisma.routineActivity.update({
    where: { id: activityId },
    data: {
      ...input,
      // Prisma requires repeatDays to be set explicitly since it's Json
      repeatDays: input.repeatDays ?? activity.repeatDays,
    },
  })
}

/**
 * Soft-delete an activity (sets active = false, preserves history).
 */
export async function deleteActivity(userId: string, activityId: string) {
  const activity = await prisma.routineActivity.findFirst({
    where: { id: activityId, routine: { userId } },
  })
  if (!activity) throw new AppError("Activity not found", 404)

  return prisma.routineActivity.update({
    where: { id: activityId },
    data: { active: false },
  })
}

// ── Today's View ──────────────────────────────────────────────────────────────

/**
 * Get today's routine view — all activities scheduled for today (based on
 * repeatDays) with their completion status for today.
 *
 * Returns each activity merged with its RoutineCompletion record for today.
 */
export async function getTodayRoutine(userId: string) {
  const routine = await prisma.routine.findFirst({
    where: { userId, active: true },
    include: { activities: { where: { active: true }, orderBy: { startTime: "asc" } } },
  })

  if (!routine) return null

  const todayStr  = todayIST()
  const todayDate = dateOnly(todayStr)
  const todayDay  = dayAbbr(new Date(), routine.timezone)

  // Filter activities that repeat on today's weekday
  const todayActivities = routine.activities.filter((a) => {
    const days = a.repeatDays as string[]
    return days.includes(todayDay)
  })

  if (todayActivities.length === 0) {
    return { routine, date: todayStr, activities: [], summary: { total: 0, done: 0, pct: 0 } }
  }

  // Fetch or auto-create completion records for today
  const activityIds = todayActivities.map((a) => a.id)

  // Upsert a PENDING completion for any activity that doesn't have one yet
  await Promise.all(
    activityIds.map((activityId) =>
      prisma.routineCompletion.upsert({
        where:  { activityId_date: { activityId, date: todayDate } },
        update: {},  // don't overwrite if already set
        create: { activityId, userId, date: todayDate, status: "PENDING" },
      })
    )
  )

  // Now fetch with completions
  const completions = await prisma.routineCompletion.findMany({
    where: { userId, date: todayDate, activityId: { in: activityIds } },
  })

  const completionMap = new Map(completions.map((c) => [c.activityId, c]))

  const activities = todayActivities.map((a) => ({
    ...a,
    completion: completionMap.get(a.id) ?? null,
  }))

  const done = completions.filter((c) => c.status === "DONE").length
  const total = activities.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return { routine, date: todayStr, activities, summary: { total, done, pct } }
}

// ── Completion Actions ────────────────────────────────────────────────────────

/**
 * Mark an activity as DONE for a given date.
 * Also updates the streak after marking complete.
 */
export async function markDone(
  userId: string,
  activityId: string,
  input: CompletionActionInput
) {
  await verifyActivityOwner(userId, activityId)
  const date = dateOnly(input.date)

  const completion = await prisma.routineCompletion.upsert({
    where:  { activityId_date: { activityId, date } },
    update: { status: "DONE", completedAt: new Date(), note: input.note },
    create: { activityId, userId, date, status: "DONE", completedAt: new Date(), note: input.note },
  })

  // Recalculate streak after every completion
  await recalculateStreak(userId, input.date)

  return completion
}

/**
 * Revert an activity back to PENDING for a given date (undo done/skip/missed).
 */
export async function markPending(
  userId: string,
  activityId: string,
  input: CompletionActionInput
) {
  await verifyActivityOwner(userId, activityId)
  const date = dateOnly(input.date)

  return prisma.routineCompletion.upsert({
    where:  { activityId_date: { activityId, date } },
    update: { status: "PENDING", completedAt: null, note: null },
    create: { activityId, userId, date, status: "PENDING" },
  })
}

/**
 * Mark an activity as SKIPPED for a given date.
 */
export async function markSkipped(
  userId: string,
  activityId: string,
  input: CompletionActionInput
) {
  await verifyActivityOwner(userId, activityId)
  const date = dateOnly(input.date)

  return prisma.routineCompletion.upsert({
    where:  { activityId_date: { activityId, date } },
    update: { status: "SKIPPED", note: input.note },
    create: { activityId, userId, date, status: "SKIPPED", note: input.note },
  })
}

/**
 * Mark an activity as MISSED for a given date.
 */
export async function markMissed(
  userId: string,
  activityId: string,
  input: CompletionActionInput
) {
  await verifyActivityOwner(userId, activityId)
  const date = dateOnly(input.date)

  return prisma.routineCompletion.upsert({
    where:  { activityId_date: { activityId, date } },
    update: { status: "MISSED", note: input.note },
    create: { activityId, userId, date, status: "MISSED", note: input.note },
  })
}

// ── Streak ────────────────────────────────────────────────────────────────────

/**
 * Get the user's current streak record (creates it if it doesn't exist).
 */
export async function getStreak(userId: string) {
  return prisma.routineStreak.upsert({
    where:  { userId },
    update: {},
    create: { userId, currentStreak: 0, longestStreak: 0 },
  })
}

/**
 * Recalculate the streak after a completion action.
 *
 * Rule: if >= 80% of today's activities are DONE → today counts as a success.
 * Consecutive successful days = streak.
 */
async function recalculateStreak(userId: string, dateStr: string) {
  const date = dateOnly(dateStr)

  // Count total and done for this date
  const total = await prisma.routineCompletion.count({ where: { userId, date } })
  const done  = await prisma.routineCompletion.count({ where: { userId, date, status: "DONE" } })

  if (total === 0) return

  const pct       = (done / total) * 100
  const isSuccess = pct >= 80

  if (!isSuccess) return // don't update streak if threshold not met

  const streak = await prisma.routineStreak.upsert({
    where:  { userId },
    update: {},
    create: { userId, currentStreak: 0, longestStreak: 0 },
  })

  const lastDay    = streak.lastSuccessfulDay
  const yesterday  = dateOnly(
    new Date(Date.now() - 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
  )

  let newCurrent: number

  if (!lastDay) {
    // First ever success
    newCurrent = 1
  } else if (lastDay.getTime() === date.getTime()) {
    // Already counted today — no change
    return
  } else if (lastDay.getTime() === yesterday.getTime()) {
    // Consecutive day — increment
    newCurrent = streak.currentStreak + 1
  } else {
    // Gap detected — restart streak
    newCurrent = 1
  }

  const newLongest = Math.max(streak.longestStreak, newCurrent)

  await prisma.routineStreak.update({
    where: { userId },
    data: {
      currentStreak:     newCurrent,
      longestStreak:     newLongest,
      lastSuccessfulDay: date,
    },
  })
}

// ── Analytics ─────────────────────────────────────────────────────────────────

/**
 * Returns completion data for the last N days — used for weekly/monthly view.
 */
export async function getRoutineAnalytics(userId: string, days = 30) {
  const from = new Date(Date.now() - days * 86_400_000)

  const completions = await prisma.routineCompletion.findMany({
    where: { userId, date: { gte: from } },
    include: { activity: { select: { name: true, category: true } } },
    orderBy: { date: "asc" },
  })

  // Group by date string
  const byDate: Record<string, { total: number; done: number; pct: number }> = {}

  for (const c of completions) {
    const key = c.date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    if (!byDate[key]) byDate[key] = { total: 0, done: 0, pct: 0 }
    byDate[key].total++
    if (c.status === "DONE") byDate[key].done++
  }

  for (const key of Object.keys(byDate)) {
    const d = byDate[key]
    d.pct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0
  }

  return byDate
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function verifyActivityOwner(userId: string, activityId: string) {
  const activity = await prisma.routineActivity.findFirst({
    where: { id: activityId, routine: { userId } },
  })
  if (!activity) throw new AppError("Activity not found", 404)
  return activity
}

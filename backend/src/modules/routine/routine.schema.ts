import { z } from "zod"

// Valid day abbreviations
const DAY = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])

// "HH:MM" 24-hour time string validator
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format (e.g. 07:30)")

// ── Create Routine ────────────────────────────────────────────────────────────

export const createRoutineSchema = z.object({
  name:     z.string().min(1).max(100).trim().default("My Routine"),
  timezone: z.string().default("Asia/Kolkata"),
})

// ── Create Activity ───────────────────────────────────────────────────────────

export const createActivitySchema = z.object({
  name: z
    .string({ required_error: "Activity name is required" })
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters")
    .trim(),

  category: z
    .enum(["LEARNING","WORK","COLLEGE","FITNESS","HEALTH","PERSONAL","FAMILY","TRAVEL","REST","CUSTOM"])
    .default("PERSONAL"),

  startTime: timeString,
  endTime:   timeString,

  repeatDays: z
    .array(DAY)
    .min(1, "Select at least one day"),

  type: z.enum(["FIXED", "FLEXIBLE"]).default("FLEXIBLE"),

  priority: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),

  goalNote: z.string().max(200).trim().nullable().optional(),
})

// ── Update Activity ───────────────────────────────────────────────────────────

export const updateActivitySchema = createActivitySchema.partial().extend({
  active: z.boolean().optional(),
})

// ── Bulk Create Activities (used in wizard final step) ───────────────────────

export const bulkCreateActivitiesSchema = z.object({
  activities: z.array(createActivitySchema).min(1, "At least one activity required"),
})

// ── Complete / Skip / Reschedule ─────────────────────────────────────────────

export const completionActionSchema = z.object({
  // date in "YYYY-MM-DD" format — which day to mark
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),

  note: z.string().max(200).trim().optional(),
})

export const rescheduleActivitySchema = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note:      z.string().max(200).trim().optional(),
})

// ── Types ─────────────────────────────────────────────────────────────────────

export type CreateRoutineInput      = z.infer<typeof createRoutineSchema>
export type CreateActivityInput     = z.infer<typeof createActivitySchema>
export type UpdateActivityInput     = z.infer<typeof updateActivitySchema>
export type BulkCreateInput         = z.infer<typeof bulkCreateActivitiesSchema>
export type CompletionActionInput   = z.infer<typeof completionActionSchema>
export type RescheduleActivityInput = z.infer<typeof rescheduleActivitySchema>

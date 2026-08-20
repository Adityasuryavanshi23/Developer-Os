import api from "../../services/api"

// ── Types ─────────────────────────────────────────────────────────────────────

export type Day = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"
export type RoutineCategory = "LEARNING" | "WORK" | "COLLEGE" | "FITNESS" | "HEALTH" | "PERSONAL" | "FAMILY" | "TRAVEL" | "REST" | "CUSTOM"
export type ActivityType = "FIXED" | "FLEXIBLE"
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
export type CompletionStatus = "PENDING" | "DONE" | "SKIPPED" | "MISSED"

export interface RoutineActivity {
  id: string
  routineId: string
  name: string
  category: RoutineCategory
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  repeatDays: Day[]
  type: ActivityType
  priority: Priority
  goalNote?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface RoutineCompletion {
  id: string
  activityId: string
  userId: string
  date: string
  status: CompletionStatus
  completedAt?: string
  note?: string
}

export interface Routine {
  id: string
  userId: string
  name: string
  timezone: string
  active: boolean
  activities: RoutineActivity[]
  createdAt: string
  updatedAt: string
}

export interface TodayActivity extends RoutineActivity {
  completion: RoutineCompletion | null
}

export interface TodayRoutine {
  routine: Routine
  date: string
  activities: TodayActivity[]
  summary: { total: number; done: number; pct: number }
}

export interface RoutineStreak {
  id: string
  userId: string
  currentStreak: number
  longestStreak: number
  lastSuccessfulDay?: string
}

export interface CreateActivityInput {
  name: string
  category: RoutineCategory
  startTime: string
  endTime: string
  repeatDays: Day[]
  type: ActivityType
  priority: Priority
  goalNote?: string
}

// ── Service ───────────────────────────────────────────────────────────────────

export const routineService = {
  // Get current routine (null if not set up yet)
  getRoutine: async (): Promise<Routine | null> => {
    const res = await api.get("/routine")
    return res.data.data
  },

  // Setup wizard final step — creates routine + all activities
  setup: async (payload: {
    name?: string
    timezone?: string
    activities: CreateActivityInput[]
  }): Promise<Routine> => {
    const res = await api.post("/routine/setup", {
      name: payload.name ?? "My Routine",
      timezone: payload.timezone ?? "Asia/Kolkata",
      activities: payload.activities,
    })
    return res.data.data
  },

  // Add single activity
  addActivity: async (data: CreateActivityInput): Promise<RoutineActivity> => {
    const res = await api.post("/routine/activities", data)
    return res.data.data
  },

  // Update an activity
  updateActivity: async (id: string, data: Partial<CreateActivityInput & { active: boolean }>): Promise<RoutineActivity> => {
    const res = await api.patch(`/routine/activities/${id}`, data)
    return res.data.data
  },

  // Remove an activity
  deleteActivity: async (id: string): Promise<void> => {
    await api.delete(`/routine/activities/${id}`)
  },

  // Get today's view with completion statuses
  getToday: async (): Promise<TodayRoutine | null> => {
    const res = await api.get("/routine/today")
    return res.data.data
  },

  // Mark activity as done
  markDone: async (activityId: string, date: string, note?: string): Promise<RoutineCompletion> => {
    const res = await api.post(`/routine/activities/${activityId}/done`, { date, note })
    return res.data.data
  },

  // Skip an activity
  markSkipped: async (activityId: string, date: string, note?: string): Promise<RoutineCompletion> => {
    const res = await api.post(`/routine/activities/${activityId}/skip`, { date, note })
    return res.data.data
  },

  // Mark as missed
  markMissed: async (activityId: string, date: string, note?: string): Promise<RoutineCompletion> => {
    const res = await api.post(`/routine/activities/${activityId}/missed`, { date, note })
    return res.data.data
  },

  // Revert back to pending (undo done/skip/missed)
  revert: async (activityId: string, date: string): Promise<RoutineCompletion> => {
    const res = await api.post(`/routine/activities/${activityId}/revert`, { date })
    return res.data.data
  },

  // Get streak info
  getStreak: async (): Promise<RoutineStreak> => {
    const res = await api.get("/routine/streak")
    return res.data.data
  },

  // Get analytics (last N days)
  getAnalytics: async (days = 30): Promise<Record<string, { total: number; done: number; pct: number }>> => {
    const res = await api.get(`/routine/analytics?days=${days}`)
    return res.data.data
  },
}

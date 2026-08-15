import api from "../../services/api"

export interface AnalyticsData {
  summary: {
    totalTasks: number
    completedTasks: number
    totalRevisions: number
    completedRevisions: number
    totalSkills: number
    totalTopics: number
    completedTopics: number
    streak: number
    completionRate: number
  }
  tasksByDay: { date: string; total: number; completed: number; missed: number }[]
  taskStatusPie: { name: string; value: number; fill: string }[]
  revisionsByDay: { date: string; due: number; completed: number }[]
  skillsProgress: { name: string; total: number; completed: number; inProgress: number; percent: number }[]
}

export const analyticsService = {
  get: async (): Promise<AnalyticsData> => {
    const res = await api.get("/analytics")
    return res.data.data
  },
}

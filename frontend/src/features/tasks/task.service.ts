import api from "../../services/api"

export interface Task {
  id: string
  title: string
  description?: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "MISSED" | "CARRIED_FORWARD"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  scheduledAt: string
  completedAt?: string
  carriedOver: number
  topic?: { id: string; name: string }
}

export const taskService = {
  getToday: async (): Promise<Task[]> => {
    const res = await api.get("/tasks/today")
    return res.data.data
  },

  getAll: async (): Promise<Task[]> => {
    const res = await api.get("/tasks")
    return res.data.data
  },

  create: async (data: {
    title: string
    scheduledAt: string
    priority?: string
    topicId?: string
    description?: string
  }): Promise<Task> => {
    const res = await api.post("/tasks", data)
    return res.data.data
  },

  update: async (
    id: string,
    data: Partial<{ title: string; description: string; priority: string; scheduledAt: string }>
  ): Promise<Task> => {
    const res = await api.patch(`/tasks/${id}`, data)
    return res.data.data
  },

  complete: async (id: string): Promise<Task> => {
    const res = await api.post(`/tasks/${id}/complete`)
    return res.data.data
  },

  reschedule: async (id: string, scheduledAt: string): Promise<Task> => {
    const res = await api.post(`/tasks/${id}/reschedule`, { scheduledAt })
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`)
  },
}

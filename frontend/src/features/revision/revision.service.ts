import api from "../../services/api"

export interface Revision {
  id: string
  topicId: string
  status: "PENDING" | "COMPLETED" | "SKIPPED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  scheduledAt: string
  completedAt?: string
  revisionNo: number
  topic: {
    id: string
    name: string
    skill: { id: string; name: string }
  }
}

export const revisionService = {
  getAll: async (): Promise<Revision[]> => {
    const res = await api.get("/revisions")
    return res.data.data
  },

  getDue: async (): Promise<Revision[]> => {
    const res = await api.get("/revisions/due")
    return res.data.data
  },

  create: async (data: {
    topicId: string
    scheduledAt: string
    priority?: string
  }): Promise<Revision> => {
    const res = await api.post("/revisions", data)
    return res.data.data
  },

  scheduleForTopic: async (topicId: string): Promise<Revision> => {
    const res = await api.post("/revisions/schedule", { topicId })
    return res.data.data
  },

  complete: async (id: string): Promise<Revision> => {
    const res = await api.post(`/revisions/${id}/complete`)
    return res.data.data
  },

  skip: async (id: string): Promise<Revision> => {
    const res = await api.post(`/revisions/${id}/skip`)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/revisions/${id}`)
  },
}

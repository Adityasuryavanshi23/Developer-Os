import api from "../../services/api"

// ─── Career Goal ─────────────────────────────────────────────────────────────

export interface CareerGoal {
  id: string
  title: string
  description?: string
  targetDate?: string
}

export const careerGoalService = {
  get: async (): Promise<CareerGoal | null> => {
    const res = await api.get("/career-goal")
    return res.data.data ?? null
  },

  upsert: async (data: { title: string; description?: string; targetDate?: string }) => {
    const res = await api.put("/career-goal", data)
    return res.data.data as CareerGoal
  },
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export interface Skill {
  id: string
  name: string
  level: number
  _count?: { topics: number }
}

export const skillService = {
  getAll: async (): Promise<Skill[]> => {
    const res = await api.get("/learning/skills")
    return res.data.data
  },

  create: async (name: string): Promise<Skill> => {
    const res = await api.post("/learning/skills", { name })
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/learning/skills/${id}`)
  },
}

// ─── Topics ──────────────────────────────────────────────────────────────────

export interface Topic {
  id: string
  skillId: string
  name: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  mastery: number
}

export const topicService = {
  getAll: async (): Promise<Topic[]> => {
    const res = await api.get("/learning/topics")
    return res.data.data
  },

  getBySkill: async (skillId: string): Promise<Topic[]> => {
    const res = await api.get(`/learning/topics/skill/${skillId}`)
    return res.data.data
  },

  create: async (skillId: string, name: string): Promise<Topic> => {
    const res = await api.post("/learning/topics", { skillId, name })
    return res.data.data
  },

  update: async (id: string, data: Partial<Pick<Topic, "name" | "status" | "mastery">>): Promise<Topic> => {
    const res = await api.patch(`/learning/topics/${id}`, data)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/learning/topics/${id}`)
  },
}

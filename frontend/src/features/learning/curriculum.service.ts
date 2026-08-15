import api from "../../services/api"

export type Level = "beginner" | "intermediate" | "advanced"

export interface CurriculumSummary {
  skill: string
  icon: string
  description: string
  category: "frontend" | "backend" | "dsa" | "devops" | "language" | "fullstack"
  topicCount: number
  levels: { beginner: number; intermediate: number; advanced: number }
}

export interface CurriculumTopic {
  name: string
  level: Level
}

export interface CurriculumRoadmap extends CurriculumSummary {
  topics: CurriculumTopic[]
}

export const curriculumService = {
  getAll: async (): Promise<CurriculumSummary[]> => {
    const res = await api.get("/curriculum")
    return res.data.data
  },

  getRoadmap: async (skill: string): Promise<CurriculumRoadmap> => {
    const res = await api.get(`/curriculum/${encodeURIComponent(skill)}`)
    return res.data.data
  },

  import: async (skillName: string, topicNames: string[]): Promise<{
    skill: { id: string; name: string }
    imported: number
    skipped: number
  }> => {
    const res = await api.post("/curriculum/import", { skillName, topicNames })
    return res.data.data
  },
}

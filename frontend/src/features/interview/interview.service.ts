import api from "../../services/api"

export type Difficulty = "EASY" | "MEDIUM" | "HARD"
export type InterviewType = "CONCEPTUAL" | "CODING" | "BEHAVIORAL"

export interface InterviewQuestion {
  id: string
  question: string
  topic: string
  difficulty: Difficulty
  type: InterviewType
  createdAt: string
  _count?: { attempts: number }
}

export interface InterviewAttempt {
  id: string
  questionId: string
  answer: string
  aiFeedback?: string
  score?: number
  createdAt: string
  question: InterviewQuestion
}

export const interviewService = {
  getQuestions: async (filters?: {
    topic?: string; difficulty?: string; type?: string
  }): Promise<InterviewQuestion[]> => {
    const params = new URLSearchParams()
    if (filters?.topic)      params.set("topic",      filters.topic)
    if (filters?.difficulty) params.set("difficulty", filters.difficulty)
    if (filters?.type)       params.set("type",       filters.type)
    const res = await api.get(`/interview/questions?${params}`)
    return res.data.data
  },

  createQuestion: async (data: {
    question: string; topic: string; difficulty: Difficulty; type: InterviewType
  }): Promise<InterviewQuestion> => {
    const res = await api.post("/interview/questions", data)
    return res.data.data
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await api.delete(`/interview/questions/${id}`)
  },

  submitAttempt: async (questionId: string, answer: string): Promise<InterviewAttempt> => {
    const res = await api.post(`/interview/questions/${questionId}/attempt`, { answer })
    return res.data.data
  },

  getMyAttempts: async (): Promise<InterviewAttempt[]> => {
    const res = await api.get("/interview/attempts")
    return res.data.data
  },

  getAttemptsByQuestion: async (questionId: string): Promise<InterviewAttempt[]> => {
    const res = await api.get(`/interview/questions/${questionId}/attempts`)
    return res.data.data
  },

  deleteAttempt: async (id: string): Promise<void> => {
    await api.delete(`/interview/attempts/${id}`)
  },
}

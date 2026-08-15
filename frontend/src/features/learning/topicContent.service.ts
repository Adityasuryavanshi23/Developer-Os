import api from "../../services/api"

export type Language = "en" | "hi" | "hl"

export interface YoutubeVideo {
  title: string
  channel: string
  url: string
  type: "indian" | "foreign"
}

export interface TopicContent {
  id: string
  topicName: string
  skillName: string
  suggestedTitle: string
  explanationEn: string
  explanationHi: string
  explanationHl: string
  codeExample: string | null
  interviewQs: string[]
  resources: { title: string; url: string }[]
  youtubeVideos: YoutubeVideo[]
  createdAt: string
}

export interface SavedTopicContent {
  id: string
  topicId: string
  title: string
  content: TopicContent
  createdAt: string
}

export const topicContentService = {
  get: async (topicId: string): Promise<{ data: TopicContent; fromCache: boolean }> => {
    const res = await api.get(`/topic-content/${topicId}`)
    return { data: res.data.data, fromCache: res.data.fromCache }
  },

  clearCache: async (topicId: string): Promise<void> => {
    await api.delete(`/topic-content/${topicId}`)
  },

  getSaved: async (topicId: string): Promise<SavedTopicContent[]> => {
    const res = await api.get(`/topic-content/${topicId}/saved`)
    return res.data.data
  },

  save: async (topicId: string, title: string, content: TopicContent): Promise<SavedTopicContent> => {
    const res = await api.post(`/topic-content/${topicId}/save`, { title, content })
    return res.data.data
  },

  deleteSaved: async (topicId: string, savedId: string): Promise<void> => {
    await api.delete(`/topic-content/${topicId}/saved/${savedId}`)
  },

  ask: async (topicId: string, question: string): Promise<string> => {
    const res = await api.post(`/topic-content/${topicId}/ask`, { question })
    return res.data.answer
  },
}

import { z } from "zod"

export const createQuestionSchema = z.object({
  question:   z.string().min(5, "Question too short").max(1000),
  topic:      z.string().min(1, "Topic required").max(100),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  type:       z.enum(["CONCEPTUAL", "CODING", "BEHAVIORAL"]).default("CONCEPTUAL"),
})

export const submitAttemptSchema = z.object({
  answer: z.string().min(1, "Answer cannot be empty").max(5000),
})

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type SubmitAttemptInput  = z.infer<typeof submitAttemptSchema>

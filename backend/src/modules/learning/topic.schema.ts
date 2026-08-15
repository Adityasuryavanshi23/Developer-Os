import { z } from "zod"

export const createTopicSchema = z.object({
  skillId: z
    .string({ required_error: "Skill ID is required" })
    .min(1, "Skill ID cannot be empty"),

  name: z
    .string({ required_error: "Topic name is required" })
    .min(1, "Topic name cannot be empty")
    .max(100, "Topic name must be under 100 characters")
    .trim(),
})

export const updateTopicSchema = z.object({
  name: z
    .string()
    .min(1, "Topic name cannot be empty")
    .max(100, "Topic name must be under 100 characters")
    .trim()
    .optional(),

  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"], {
      errorMap: () => ({ message: "Status must be NOT_STARTED, IN_PROGRESS, or COMPLETED" }),
    })
    .optional(),

  mastery: z
    .number()
    .min(0, "Mastery must be at least 0")
    .max(100, "Mastery must be at most 100")
    .int("Mastery must be a whole number")
    .optional(),
})

export type CreateTopicInput = z.infer<typeof createTopicSchema>
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>

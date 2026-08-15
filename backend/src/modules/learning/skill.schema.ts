import { z } from "zod"

export const createSkillSchema = z.object({
  name: z
    .string({ required_error: "Skill name is required" })
    .min(1, "Skill name cannot be empty")
    .max(50, "Skill name must be under 50 characters")
    .trim(),
})

export const updateSkillSchema = z.object({
  name: z
    .string()
    .min(1, "Skill name cannot be empty")
    .max(50, "Skill name must be under 50 characters")
    .trim()
    .optional(),

  level: z
    .number()
    .min(0, "Level must be at least 0")
    .max(100, "Level must be at most 100")
    .int("Level must be a whole number")
    .optional(),
})

export type CreateSkillInput = z.infer<typeof createSkillSchema>
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>

import { z } from "zod"

export const createCareerGoalSchema = z.object({
  title: z
    .string({ required_error: "Career goal title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters")
    .trim(),

  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .trim()
    .optional(),

  targetDate: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional(),
})

export const updateCareerGoalSchema = createCareerGoalSchema.partial()

export type CreateCareerGoalInput = z.infer<typeof createCareerGoalSchema>
export type UpdateCareerGoalInput = z.infer<typeof updateCareerGoalSchema>

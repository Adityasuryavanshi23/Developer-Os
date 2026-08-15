import { z } from "zod"

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task title is required" })
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters")
    .trim(),

  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .trim()
    .optional(),

  topicId: z.string().optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
      errorMap: () => ({ message: "Priority must be LOW, MEDIUM, HIGH, or CRITICAL" }),
    })
    .default("MEDIUM"),

  scheduledAt: z
    .string({ required_error: "Scheduled date is required" })
    .datetime({ message: "Invalid date format" }),
})

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters")
    .trim()
    .optional(),

  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .trim()
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),

  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "MISSED", "CARRIED_FORWARD"])
    .optional(),

  scheduledAt: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

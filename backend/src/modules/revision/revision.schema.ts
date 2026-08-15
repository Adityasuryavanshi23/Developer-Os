import { z } from "zod"

export const createRevisionSchema = z.object({
  topicId: z.string().min(1, "Topic is required"),
  scheduledAt: z.string().min(1, "Scheduled date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default("MEDIUM"),
})

export const updateRevisionSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "SKIPPED"]).optional(),
  scheduledAt: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
})

export type CreateRevisionInput = z.infer<typeof createRevisionSchema>
export type UpdateRevisionInput = z.infer<typeof updateRevisionSchema>

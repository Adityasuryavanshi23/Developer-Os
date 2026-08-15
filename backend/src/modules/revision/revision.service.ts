import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type { CreateRevisionInput, UpdateRevisionInput } from "./revision.schema"

// Spaced repetition intervals in days: Day 1 → 3 → 7 → 15 → 30 → 60
const SPACED_INTERVALS = [1, 3, 7, 15, 30, 60]

export async function getAllRevisions(userId: string) {
  return prisma.revision.findMany({
    where: { userId },
    include: { topic: { select: { id: true, name: true, skill: { select: { id: true, name: true } } } } },
    orderBy: { scheduledAt: "asc" },
  })
}

export async function getTodayRevisions(userId: string) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return prisma.revision.findMany({
    where: { userId, scheduledAt: { gte: start, lte: end } },
    include: { topic: { select: { id: true, name: true, skill: { select: { id: true, name: true } } } } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  })
}

export async function getDueRevisions(userId: string) {
  // All pending revisions that are due today or overdue
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  return prisma.revision.findMany({
    where: {
      userId,
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    include: { topic: { select: { id: true, name: true, skill: { select: { id: true, name: true } } } } },
    orderBy: { scheduledAt: "asc" },
  })
}

export async function createRevision(userId: string, input: CreateRevisionInput) {
  // Verify topic belongs to user
  const topic = await prisma.topic.findFirst({ where: { id: input.topicId, userId } })
  if (!topic) throw new AppError("Topic not found", 404)

  // Count existing revisions for this topic to determine revision number
  const existingCount = await prisma.revision.count({ where: { userId, topicId: input.topicId } })
  const revisionNo = existingCount + 1

  return prisma.revision.create({
    data: {
      userId,
      topicId: input.topicId,
      priority: input.priority,
      scheduledAt: new Date(input.scheduledAt),
      revisionNo,
    },
    include: { topic: { select: { id: true, name: true, skill: { select: { id: true, name: true } } } } },
  })
}

export async function completeRevision(userId: string, revisionId: string) {
  const revision = await prisma.revision.findFirst({ where: { id: revisionId, userId } })
  if (!revision) throw new AppError("Revision not found", 404)
  if (revision.status === "COMPLETED") throw new AppError("Already completed", 400)

  const updated = await prisma.revision.update({
    where: { id: revisionId },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: { topic: { select: { id: true, name: true } } },
  })

  // Auto-schedule next spaced repetition revision if interval exists
  const nextIntervalDays = SPACED_INTERVALS[revision.revisionNo] // revisionNo is 1-based
  if (nextIntervalDays) {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + nextIntervalDays)
    await prisma.revision.create({
      data: {
        userId,
        topicId: revision.topicId,
        priority: revision.priority,
        scheduledAt: nextDate,
        revisionNo: revision.revisionNo + 1,
      },
    })
  }

  return updated
}

export async function skipRevision(userId: string, revisionId: string) {
  const revision = await prisma.revision.findFirst({ where: { id: revisionId, userId } })
  if (!revision) throw new AppError("Revision not found", 404)

  return prisma.revision.update({
    where: { id: revisionId },
    data: { status: "SKIPPED" },
  })
}

export async function deleteRevision(userId: string, revisionId: string) {
  const revision = await prisma.revision.findFirst({ where: { id: revisionId, userId } })
  if (!revision) throw new AppError("Revision not found", 404)
  await prisma.revision.delete({ where: { id: revisionId } })
}

export async function scheduleRevisionForTopic(userId: string, topicId: string) {
  // Convenience: schedule first revision for a topic for tomorrow
  const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
  if (!topic) throw new AppError("Topic not found", 404)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  return prisma.revision.create({
    data: {
      userId,
      topicId,
      scheduledAt: tomorrow,
      revisionNo: 1,
    },
    include: { topic: { select: { id: true, name: true } } },
  })
}

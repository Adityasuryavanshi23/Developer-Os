import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type { CreateTaskInput, UpdateTaskInput } from "./task.schema"

export async function getTodayTasks(userId: string) {
  // Get all tasks scheduled for today (start of day to end of day)
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  return prisma.task.findMany({
    where: {
      userId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      topic: { select: { id: true, name: true } },
    },
    orderBy: [
      // Show critical/high priority tasks first
      { priority: "desc" },
      { createdAt: "asc" },
    ],
  })
}

export async function getAllTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    include: { topic: { select: { id: true, name: true } } },
    orderBy: { scheduledAt: "desc" },
  })
}

export async function createTask(userId: string, input: CreateTaskInput) {
  // If topicId is provided, make sure it belongs to this user
  if (input.topicId) {
    const topic = await prisma.topic.findFirst({
      where: { id: input.topicId, userId },
    })
    if (!topic) {
      throw new AppError("Topic not found", 404)
    }
  }

  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      topicId: input.topicId,
      priority: input.priority,
      scheduledAt: new Date(input.scheduledAt),
    },
  })
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  })

  if (!task) {
    throw new AppError("Task not found", 404)
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...input,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    },
  })
}

export async function completeTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  })

  if (!task) {
    throw new AppError("Task not found", 404)
  }

  if (task.status === "COMPLETED") {
    throw new AppError("Task is already completed", 400)
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  })
}

export async function rescheduleTask(userId: string, taskId: string, scheduledAt: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  })

  if (!task) {
    throw new AppError("Task not found", 404)
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: "CARRIED_FORWARD",
      scheduledAt: new Date(scheduledAt),
      // track how many times it was pushed forward
      carriedOver: { increment: 1 },
    },
  })
}

export async function deleteTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  })

  if (!task) {
    throw new AppError("Task not found", 404)
  }

  await prisma.task.delete({ where: { id: taskId } })
}

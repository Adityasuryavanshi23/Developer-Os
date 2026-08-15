import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type { CreateTopicInput, UpdateTopicInput } from "./topic.schema"

export async function getTopicsBySkill(userId: string, skillId: string) {
  // Make sure the skill belongs to this user first
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, userId },
  })

  if (!skill) {
    throw new AppError("Skill not found", 404)
  }

  return prisma.topic.findMany({
    where: { skillId, userId },
    orderBy: { createdAt: "asc" },
  })
}

export async function getAllTopics(userId: string) {
  return prisma.topic.findMany({
    where: { userId },
    include: { skill: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  })
}

export async function createTopic(userId: string, input: CreateTopicInput) {
  // Verify the skill belongs to this user
  const skill = await prisma.skill.findFirst({
    where: { id: input.skillId, userId },
  })

  if (!skill) {
    throw new AppError("Skill not found", 404)
  }

  return prisma.topic.create({
    data: {
      userId,
      skillId: input.skillId,
      name: input.name,
    },
  })
}

export async function updateTopic(userId: string, topicId: string, input: UpdateTopicInput) {
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, userId },
  })

  if (!topic) {
    throw new AppError("Topic not found", 404)
  }

  return prisma.topic.update({
    where: { id: topicId },
    data: input,
  })
}

export async function deleteTopic(userId: string, topicId: string) {
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, userId },
  })

  if (!topic) {
    throw new AppError("Topic not found", 404)
  }

  await prisma.topic.delete({ where: { id: topicId } })
}

import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type { CreateSkillInput, UpdateSkillInput } from "./skill.schema"

export async function getAllSkills(userId: string) {
  return prisma.skill.findMany({
    where: { userId },
    include: {
      // include topic count so the frontend can show "5 topics" without a separate request
      _count: { select: { topics: true } },
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function createSkill(userId: string, input: CreateSkillInput) {
  // Skill names should be unique per user
  const existing = await prisma.skill.findUnique({
    where: { userId_name: { userId, name: input.name } },
  })

  if (existing) {
    throw new AppError(`You already have a skill named "${input.name}"`, 409)
  }

  return prisma.skill.create({
    data: { userId, name: input.name },
  })
}

export async function updateSkill(userId: string, skillId: string, input: UpdateSkillInput) {
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, userId },
  })

  if (!skill) {
    throw new AppError("Skill not found", 404)
  }

  return prisma.skill.update({
    where: { id: skillId },
    data: input,
  })
}

export async function deleteSkill(userId: string, skillId: string) {
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, userId },
  })

  if (!skill) {
    throw new AppError("Skill not found", 404)
  }

  // Cascade delete will also remove all topics under this skill
  await prisma.skill.delete({ where: { id: skillId } })
}

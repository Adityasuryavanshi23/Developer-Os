import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type { CreateSkillInput, UpdateSkillInput } from "./skill.schema"

export async function getAllSkills(userId: string) {
  const skills = await prisma.skill.findMany({
    where: { userId },
    include: {
      _count: { select: { topics: true } },
      topics: { select: { status: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  // Calculate completion percentage from topics: COMPLETED / total * 100
  return skills.map((skill) => {
    const total = skill.topics.length
    const completed = skill.topics.filter((t) => t.status === "COMPLETED").length
    const level = total > 0 ? Math.round((completed / total) * 100) : 0
    const { topics: _, ...rest } = skill
    return { ...rest, level }
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

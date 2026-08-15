import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type { CreateCareerGoalInput, UpdateCareerGoalInput } from "./careerGoal.schema"

export async function getCareerGoal(userId: string) {
  const goal = await prisma.careerGoal.findUnique({
    where: { userId },
  })
  return goal
}

export async function upsertCareerGoal(userId: string, input: CreateCareerGoalInput) {
  // upsert = update if exists, create if not — user can only have one career goal
  const goal = await prisma.careerGoal.upsert({
    where: { userId },
    update: {
      title: input.title,
      description: input.description,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
    },
    create: {
      userId,
      title: input.title,
      description: input.description,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
    },
  })
  return goal
}

export async function deleteCareerGoal(userId: string) {
  const existing = await prisma.careerGoal.findUnique({ where: { userId } })

  if (!existing) {
    throw new AppError("Career goal not found", 404)
  }

  await prisma.careerGoal.delete({ where: { userId } })
}

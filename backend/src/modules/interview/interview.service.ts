import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import type { CreateQuestionInput, SubmitAttemptInput } from "./interview.schema"

// ── Questions ─────────────────────────────────────────────────────────────────

export async function getAllQuestions(filters?: {
  topic?: string
  difficulty?: string
  type?: string
}) {
  return prisma.interviewQuestion.findMany({
    where: {
      topic:      filters?.topic      ? { equals: filters.topic, mode: "insensitive" } : undefined,
      difficulty: filters?.difficulty as any ?? undefined,
      type:       filters?.type       as any ?? undefined,
    },
    include: {
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function createQuestion(input: CreateQuestionInput) {
  return prisma.interviewQuestion.create({
    data: {
      question:   input.question,
      topic:      input.topic,
      difficulty: input.difficulty,
      type:       input.type,
    },
  })
}

export async function deleteQuestion(questionId: string) {
  const q = await prisma.interviewQuestion.findUnique({ where: { id: questionId } })
  if (!q) throw new AppError("Question not found", 404)
  await prisma.interviewQuestion.delete({ where: { id: questionId } })
}

// ── Attempts ──────────────────────────────────────────────────────────────────

export async function submitAttempt(
  userId: string,
  questionId: string,
  input: SubmitAttemptInput
) {
  const question = await prisma.interviewQuestion.findUnique({ where: { id: questionId } })
  if (!question) throw new AppError("Question not found", 404)

  return prisma.interviewAttempt.create({
    data: { userId, questionId, answer: input.answer },
    include: { question: true },
  })
}

export async function getUserAttempts(userId: string, questionId?: string) {
  return prisma.interviewAttempt.findMany({
    where: {
      userId,
      questionId: questionId ?? undefined,
    },
    include: {
      question: { select: { id: true, question: true, topic: true, difficulty: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAttemptById(userId: string, attemptId: string) {
  const attempt = await prisma.interviewAttempt.findFirst({
    where: { id: attemptId, userId },
    include: { question: true },
  })
  if (!attempt) throw new AppError("Attempt not found", 404)
  return attempt
}

export async function deleteAttempt(userId: string, attemptId: string) {
  const attempt = await prisma.interviewAttempt.findFirst({ where: { id: attemptId, userId } })
  if (!attempt) throw new AppError("Attempt not found", 404)
  await prisma.interviewAttempt.delete({ where: { id: attemptId } })
}

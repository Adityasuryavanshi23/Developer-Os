import type { Request, Response, NextFunction } from "express"
import { createQuestionSchema, submitAttemptSchema } from "./interview.schema"
import * as interviewService from "./interview.service"

export async function getQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { topic, difficulty, type } = req.query as Record<string, string>
    const data = await interviewService.getAllQuestions({ topic, difficulty, type })
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createQuestionSchema.parse(req.body)
    const data = await interviewService.createQuestion(input)
    res.status(201).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    await interviewService.deleteQuestion(req.params["id"] as string)
    res.json({ success: true, message: "Question deleted" })
  } catch (err) { next(err) }
}

export async function submitAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const input = submitAttemptSchema.parse(req.body)
    const data = await interviewService.submitAttempt(
      req.userId!, req.params["id"] as string, input
    )
    res.status(201).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getMyAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await interviewService.getUserAttempts(req.userId!)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getAttemptsByQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await interviewService.getUserAttempts(req.userId!, req.params["id"] as string)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function deleteAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    await interviewService.deleteAttempt(req.userId!, req.params["id"] as string)
    res.json({ success: true, message: "Attempt deleted" })
  } catch (err) { next(err) }
}

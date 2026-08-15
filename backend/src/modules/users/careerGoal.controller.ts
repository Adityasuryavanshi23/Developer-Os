import { Request, Response, NextFunction } from "express"
import { createCareerGoalSchema, updateCareerGoalSchema } from "./careerGoal.schema"
import { getCareerGoal, upsertCareerGoal, deleteCareerGoal } from "./careerGoal.service"

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const goal = await getCareerGoal(req.userId)
    res.json({ success: true, data: goal })
  } catch (err) {
    next(err)
  }
}

export async function upsert(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCareerGoalSchema.parse(req.body)
    const goal = await upsertCareerGoal(req.userId, input)
    res.status(200).json({ success: true, message: "Career goal saved", data: goal })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteCareerGoal(req.userId)
    res.json({ success: true, message: "Career goal deleted" })
  } catch (err) {
    next(err)
  }
}

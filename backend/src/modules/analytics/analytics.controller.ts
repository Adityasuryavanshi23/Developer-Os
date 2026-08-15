import type { Request, Response, NextFunction } from "express"
import { getAnalytics } from "./analytics.service"

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getAnalytics(req.userId!)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

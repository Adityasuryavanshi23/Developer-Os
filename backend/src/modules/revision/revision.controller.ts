import type { Request, Response, NextFunction } from "express"
import * as revisionService from "./revision.service"
import { createRevisionSchema } from "./revision.schema"

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await revisionService.getAllRevisions(req.userId!)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getToday(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await revisionService.getTodayRevisions(req.userId!)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getDue(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await revisionService.getDueRevisions(req.userId!)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createRevisionSchema.parse(req.body)
    const data = await revisionService.createRevision(req.userId!, input)
    res.status(201).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await revisionService.completeRevision(req.userId!, req.params["id"] as string)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function skip(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await revisionService.skipRevision(req.userId!, req.params["id"] as string)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await revisionService.deleteRevision(req.userId!, req.params["id"] as string)
    res.json({ success: true, message: "Revision deleted" })
  } catch (err) { next(err) }
}

export async function scheduleForTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { topicId } = req.body
    if (!topicId) {
      res.status(400).json({ success: false, message: "topicId is required" })
      return
    }
    const data = await revisionService.scheduleRevisionForTopic(req.userId!, topicId)
    res.status(201).json({ success: true, data })
  } catch (err) { next(err) }
}

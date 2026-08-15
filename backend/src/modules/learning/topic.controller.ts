import { Request, Response, NextFunction } from "express"
import { createTopicSchema, updateTopicSchema } from "./topic.schema"
import { getAllTopics, getTopicsBySkill, createTopic, updateTopic, deleteTopic } from "./topic.service"

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const topics = await getAllTopics(req.userId)
    res.json({ success: true, data: topics })
  } catch (err) {
    next(err)
  }
}

export async function getBySkill(req: Request, res: Response, next: NextFunction) {
  try {
    const topics = await getTopicsBySkill(req.userId, req.params.skillId as string)
    res.json({ success: true, data: topics })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createTopicSchema.parse(req.body)
    const topic = await createTopic(req.userId, input)
    res.status(201).json({ success: true, message: "Topic created", data: topic })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateTopicSchema.parse(req.body)
    const topic = await updateTopic(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Topic updated", data: topic })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteTopic(req.userId, req.params.id as string)
    res.json({ success: true, message: "Topic deleted" })
  } catch (err) {
    next(err)
  }
}

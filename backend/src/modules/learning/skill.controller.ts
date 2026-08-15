import { Request, Response, NextFunction } from "express"
import { createSkillSchema, updateSkillSchema } from "./skill.schema"
import { getAllSkills, createSkill, updateSkill, deleteSkill } from "./skill.service"

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const skills = await getAllSkills(req.userId)
    res.json({ success: true, data: skills })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createSkillSchema.parse(req.body)
    const skill = await createSkill(req.userId, input)
    res.status(201).json({ success: true, message: "Skill created", data: skill })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateSkillSchema.parse(req.body)
    const skill = await updateSkill(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Skill updated", data: skill })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteSkill(req.userId, req.params.id as string)
    res.json({ success: true, message: "Skill deleted" })
  } catch (err) {
    next(err)
  }
}

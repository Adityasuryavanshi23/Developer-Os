import { Request, Response, NextFunction } from "express"
import { createTaskSchema, updateTaskSchema } from "./task.schema"
import {
  getTodayTasks,
  getAllTasks,
  createTask,
  updateTask,
  completeTask,
  rescheduleTask,
  deleteTask,
} from "./task.service"
import { z } from "zod"

export async function getToday(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await getTodayTasks(req.userId)
    res.json({ success: true, data: tasks })
  } catch (err) {
    next(err)
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await getAllTasks(req.userId)
    res.json({ success: true, data: tasks })
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createTaskSchema.parse(req.body)
    const task = await createTask(req.userId, input)
    res.status(201).json({ success: true, message: "Task created", data: task })
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateTaskSchema.parse(req.body)
    const task = await updateTask(req.userId, req.params.id as string, input)
    res.json({ success: true, message: "Task updated", data: task })
  } catch (err) {
    next(err)
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await completeTask(req.userId, req.params.id as string)
    res.json({ success: true, message: "Task marked as complete", data: task })
  } catch (err) {
    next(err)
  }
}

export async function reschedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { scheduledAt } = z
      .object({ scheduledAt: z.string().datetime({ message: "Invalid date format" }) })
      .parse(req.body)

    const task = await rescheduleTask(req.userId, req.params.id as string, scheduledAt)
    res.json({ success: true, message: "Task rescheduled", data: task })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteTask(req.userId, req.params.id as string)
    res.json({ success: true, message: "Task deleted" })
  } catch (err) {
    next(err)
  }
}

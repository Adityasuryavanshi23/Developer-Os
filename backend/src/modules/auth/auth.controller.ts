import { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { registerSchema, loginSchema } from "./auth.schema"
import { registerUser, loginUser, getMe, updateProfile, changePassword, deleteAccount } from "./auth.service"

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body)
    const result = await registerUser(input)
    res.status(201).json({ success: true, message: "Account created successfully", data: result })
  } catch (err) { next(err) }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body)
    const result = await loginUser(input)
    res.status(200).json({ success: true, message: "Logged in successfully", data: result })
  } catch (err) { next(err) }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getMe(req.userId!)
    res.status(200).json({ success: true, data: user })
  } catch (err) { next(err) }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = z.object({ name: z.string().min(2).max(100).trim() }).parse(req.body)
    const user = await updateProfile(req.userId!, { name })
    res.json({ success: true, data: user })
  } catch (err) { next(err) }
}

export async function changePasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    }).parse(req.body) as { currentPassword: string; newPassword: string }
    await changePassword(req.userId!, input)
    res.json({ success: true, message: "Password changed successfully" })
  } catch (err) { next(err) }
}

export async function deleteAccountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteAccount(req.userId!)
    res.json({ success: true, message: "Account deleted" })
  } catch (err) { next(err) }
}

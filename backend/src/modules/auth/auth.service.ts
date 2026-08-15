import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "../../database/prisma"
import { AppError } from "../../middleware/errorHandler"
import { env } from "../../config/env"
import type { RegisterInput, LoginInput } from "./auth.schema"

export interface UpdateProfileInput { name: string }
export interface ChangePasswordInput { currentPassword: string; newPassword: string }

// All auth business logic lives here.
// The controller just calls these functions and sends the response.

export async function registerUser(input: RegisterInput) {
  // Check if this email is already taken
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existing) {
    throw new AppError("An account with this email already exists", 409)
  }

  // Never store plain text passwords — hash with bcrypt (12 rounds is a good balance)
  const hashedPassword = await bcrypt.hash(input.password, 12)

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
    // Only return safe fields — never return the password
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })

  const token = signToken(user.id)

  return { user, token }
}

export async function loginUser(input: LoginInput) {
  // Find the user — include password this time so we can compare
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })

  // Use the same error message for "user not found" and "wrong password"
  // This prevents attackers from figuring out which emails are registered
  const isValid = user ? await bcrypt.compare(input.password, user.password) : false

  if (!user || !isValid) {
    throw new AppError("Invalid email or password", 401)
  }

  const token = signToken(user.id)

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  return user
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name.trim() },
    select: { id: true, name: true, email: true, createdAt: true },
  })
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError("User not found", 404)

  const isValid = await bcrypt.compare(input.currentPassword, user.password)
  if (!isValid) throw new AppError("Current password is incorrect", 400)

  const hashed = await bcrypt.hash(input.newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
}

export async function deleteAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } })
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  })
}

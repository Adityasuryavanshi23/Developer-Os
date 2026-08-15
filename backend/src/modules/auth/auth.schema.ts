import { z } from "zod"

// Zod schemas define the rules for what valid input looks like.
// If the request body doesn't match, we reject it before it touches the DB.

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .trim(),

  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email")
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email")
    .toLowerCase()
    .trim(),

  password: z.string({ required_error: "Password is required" }),
})

// TypeScript types inferred from the schemas — no need to write them manually
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

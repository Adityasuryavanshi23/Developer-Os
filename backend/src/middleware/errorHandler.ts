import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"

// Global error handler — placed last in Express middleware chain.
// Catches any error thrown or passed via next(error) from any route.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Zod validation error — e.g. missing required field, wrong type
  // Returns clear field-level messages like: { "password": "Password is required" }
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {}
    err.errors.forEach((e) => {
      const field = e.path.join(".") || "input"
      errors[field] = e.message
    })
    res.status(400).json({ success: false, message: "Validation failed", errors })
    return
  }

  // Known operational errors we throw ourselves (wrong password, not found, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message })
    return
  }

  // Unexpected error — log it but don't leak internals to the client
  console.error(err)

  const message =
    process.env.NODE_ENV === "development" && err instanceof Error
      ? err.message
      : "Something went wrong"

  res.status(500).json({ success: false, message })
}

// Simple custom error class so we can throw errors with a status code
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = "AppError"
  }
}

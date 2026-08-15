import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"

// Shape of the JWT payload we sign during login
interface JwtPayload {
  userId: string
}

// Extend Express Request so downstream handlers can access req.userId
declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

// Protect any route that needs a logged-in user.
// Usage: router.get("/me", authenticate, meController)
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" })
  }
}

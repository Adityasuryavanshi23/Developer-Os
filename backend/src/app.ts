import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"

import { env } from "./config/env"
import { errorHandler } from "./middleware/errorHandler"
import router from "./routes/index"

const app = express()

// Trust Render's proxy (required for express-rate-limit on Render)
app.set("trust proxy", 1)

// ─── Security ──────────────────────────────────────────────────────────────

// helmet sets secure HTTP headers (XSS protection, no sniff, etc.)
app.use(helmet())

// Only accept requests from our frontend
const allowedOrigins = [
  "http://localhost:5173",
  env.CLIENT_URL,
].filter(Boolean) as string[]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: true,
  })
)

// Limit each IP to 100 requests per 15 minutes to prevent abuse
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: "Too many requests, please try again later" },
  })
)

// ─── Body parsing ──────────────────────────────────────────────────────────

app.use(express.json())

// ─── Routes ────────────────────────────────────────────────────────────────

app.use("/api", router)

// Health check — useful for deployment / uptime monitoring
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server is running" })
})

// ─── Error handler (must be last) ─────────────────────────────────────────
// Express 5 needs the error handler to be explicitly cast so it recognises the 4-arg signature
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorHandler(err, req, res, next)
})

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
  console.log(`Environment: ${env.NODE_ENV}`)
})

export default app

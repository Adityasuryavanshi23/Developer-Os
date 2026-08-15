import dotenv from "dotenv"

dotenv.config()

// All environment variables in one place.
// App will crash at startup if any required variable is missing — better to know early.
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3000", 10),

  DATABASE_URL: requireEnv("DATABASE_URL"),

  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",

  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",

  GEMINI_API_KEY: requireEnv("GEMINI_API_KEY"),
}

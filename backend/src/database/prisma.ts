import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../generated/prisma"

// Prisma 7 requires a driver adapter to connect to the database.
// PrismaPg uses the pg library under the hood to talk to PostgreSQL (Neon).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// Single shared Prisma instance for the whole app.
// We attach it to globalThis in dev so hot-reload doesn't create multiple connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

import { PrismaClient } from "@prisma/client"

declare global {
  var prismaClient: PrismaClient | undefined
}

export const prisma =
  globalThis.prismaClient ??
  new PrismaClient({
    log: ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClient = prisma
}

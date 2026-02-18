import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash("admin12345", 12)
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Admin User",
      passwordHash: adminPassword,
      admin: true,
      status: "ENABLED",
    },
    create: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash: adminPassword,
      admin: true,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

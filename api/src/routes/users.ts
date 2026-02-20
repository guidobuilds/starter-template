import { Prisma, UserStatus } from "@prisma/client"
import { Elysia } from "elysia"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { errorResponse } from "@/lib/errors"

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  status: z.enum(["ENABLED", "DISABLED"]).optional(),
  admin: z.boolean().optional(),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  status: z.enum(["ENABLED", "DISABLED"]).optional(),
  admin: z.boolean().optional(),
})

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["ENABLED", "DISABLED"]).optional(),
})

const idParamSchema = z.object({
  id: z.string().min(1),
})

export const usersRoutes = new Elysia({ prefix: "/users" })
  .post("/", async ({ body, set }) => {
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: parsed.data.name,
            email: parsed.data.email,
            status: (parsed.data.status as UserStatus | undefined) ?? UserStatus.ENABLED,
            admin: parsed.data.admin ?? false,
          },
        })
        const ws = await tx.workspace.create({
          data: { name: `${user.name}'s workspace`, ownerId: user.id, isDefault: true },
        })
        await tx.workspaceMember.create({
          data: { workspaceId: ws.id, userId: user.id },
        })
        return user
      })
      set.status = 201
      return created
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") ||
        (error instanceof Error && error.message.includes("Unique constraint"))
      ) {
        set.status = 409
        return errorResponse("EMAIL_CONFLICT", "Email already exists")
      }

      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not create user")
    }
  })
  .get("/", async ({ query, set }) => {
    const parsed = listQuerySchema.safeParse(query)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid query params", parsed.error.flatten())
    }

    const { page, pageSize, search, status } = parsed.data
    const where = {
      ...(status ? { status: status as UserStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ])

    return {
      items,
      total,
      page,
      pageSize,
    }
  })
  .get("/:id", async ({ params, set }) => {
    const parsed = idParamSchema.safeParse(params)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid user id", parsed.error.flatten())
    }

    const user = await prisma.user.findUnique({ where: { id: parsed.data.id } })
    if (!user) {
      set.status = 404
      return errorResponse("NOT_FOUND", "User not found")
    }

    return user
  })
  .patch("/:id", async ({ params, body, set }) => {
    const parsedParams = idParamSchema.safeParse(params)
    if (!parsedParams.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid user id", parsedParams.error.flatten())
    }

    const parsedBody = updateUserSchema.safeParse(body)
    if (!parsedBody.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsedBody.error.flatten())
    }

    try {
      const updated = await prisma.user.update({
        where: { id: parsedParams.data.id },
        data: parsedBody.data,
      })
      return updated
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") ||
        (error instanceof Error && error.message.includes("Record to update not found"))
      ) {
        set.status = 404
        return errorResponse("NOT_FOUND", "User not found")
      }
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") ||
        (error instanceof Error && error.message.includes("Unique constraint"))
      ) {
        set.status = 409
        return errorResponse("EMAIL_CONFLICT", "Email already exists")
      }

      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not update user")
    }
  })
  .delete("/:id", async ({ params, set }) => {
    const parsed = idParamSchema.safeParse(params)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid user id", parsed.error.flatten())
    }

    try {
      await prisma.user.delete({ where: { id: parsed.data.id } })
      return { success: true }
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") ||
        (error instanceof Error && error.message.includes("Record to delete does not exist"))
      ) {
        set.status = 404
        return errorResponse("NOT_FOUND", "User not found")
      }

      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not delete user")
    }
  })

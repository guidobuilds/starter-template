import { Prisma } from "@prisma/client"
import { Elysia } from "elysia"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { errorResponse } from "@/lib/errors"

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  ownerId: z.string().min(1),
  isDefault: z.boolean().optional(),
})

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
})

const listWorkspacesQuerySchema = z.object({
  userId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const inviteSchema = z.object({
  email: z.email(),
  invitedById: z.string().min(1),
  inviterName: z.string().min(1),
  workspaceName: z.string().min(1),
})

const acceptInviteSchema = z.object({
  userId: z.string().min(1),
})

const removeMemberQuerySchema = z.object({
  actorId: z.string().min(1),
})

export const workspacesRoutes = new Elysia({ prefix: "/workspaces" })
  .post("/", async ({ body, set }) => {
    const parsed = createWorkspaceSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const { name, ownerId, isDefault } = parsed.data

    if (!isDefault) {
      const settings = await prisma.appSettings.findUnique({ where: { id: "default" } })
      if (settings && !settings.workspacesEnabled) {
        set.status = 403
        return errorResponse("WORKSPACES_DISABLED", "Workspaces feature is disabled")
      }
    }

    try {
      const workspace = await prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
          data: { name, ownerId, isDefault: isDefault ?? false },
        })
        await tx.workspaceMember.create({
          data: { workspaceId: ws.id, userId: ownerId },
        })
        return ws
      })
      set.status = 201
      return workspace
    } catch (error: unknown) {
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not create workspace")
    }
  })
  .get("/", async ({ query, set }) => {
    const parsed = listWorkspacesQuerySchema.safeParse(query)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid query params", parsed.error.flatten())
    }

    const { userId, page, pageSize } = parsed.data

    if (!userId) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "userId is required")
    }

    const where = {
      members: { some: { userId } },
    }

    const [items, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        include: { owner: { select: { id: true, name: true, email: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "asc" },
      }),
      prisma.workspace.count({ where }),
    ])

    return { items, total, page, pageSize }
  })
  .get("/invitations/:token", async ({ params, set }) => {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
      include: {
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
      },
    })

    if (!invitation) {
      set.status = 404
      return errorResponse("NOT_FOUND", "Invitation not found")
    }

    if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      set.status = 410
      return errorResponse("EXPIRED", "Invitation has expired or already been used")
    }

    return invitation
  })
  .post("/invitations/:token/accept", async ({ params, body, set }) => {
    const parsed = acceptInviteSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const { userId } = parsed.data

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token: params.token },
    })

    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      set.status = 410
      return errorResponse("EXPIRED", "Invitation has expired or already been used")
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.workspaceMember.create({
          data: { workspaceId: invitation.workspaceId, userId },
        })
        await tx.workspaceInvitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        })
      })
      return { workspaceId: invitation.workspaceId }
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") ||
        (error instanceof Error && error.message.includes("Unique constraint"))
      ) {
        set.status = 409
        return errorResponse("ALREADY_MEMBER", "User is already a member of this workspace")
      }
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not accept invitation")
    }
  })
  .get("/:id", async ({ params, set }) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        invitations: {
          where: { status: "PENDING" },
          select: { id: true, email: true, status: true, expiresAt: true, createdAt: true },
        },
      },
    })

    if (!workspace) {
      set.status = 404
      return errorResponse("NOT_FOUND", "Workspace not found")
    }

    return workspace
  })
  .patch("/:id", async ({ params, body, set }) => {
    const parsed = updateWorkspaceSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    try {
      const updated = await prisma.workspace.update({
        where: { id: params.id },
        data: { name: parsed.data.name },
      })
      return updated
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") ||
        (error instanceof Error && error.message.includes("Record to update not found"))
      ) {
        set.status = 404
        return errorResponse("NOT_FOUND", "Workspace not found")
      }
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not update workspace")
    }
  })
  .delete("/:id", async ({ params, set }) => {
    const workspace = await prisma.workspace.findUnique({ where: { id: params.id } })

    if (!workspace) {
      set.status = 404
      return errorResponse("NOT_FOUND", "Workspace not found")
    }

    if (workspace.isDefault) {
      set.status = 403
      return errorResponse("CANNOT_DELETE_DEFAULT", "Cannot delete the default workspace")
    }

    try {
      await prisma.workspace.delete({ where: { id: params.id } })
      return { success: true }
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") ||
        (error instanceof Error && error.message.includes("Record to delete does not exist"))
      ) {
        set.status = 404
        return errorResponse("NOT_FOUND", "Workspace not found")
      }
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not delete workspace")
    }
  })
  .post("/:id/invitations", async ({ params, body, set }) => {
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "Invalid request body", parsed.error.flatten())
    }

    const { email, invitedById } = parsed.data
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invitation = await prisma.workspaceInvitation.upsert({
      where: { workspaceId_email: { workspaceId: params.id, email } },
      create: {
        email,
        workspaceId: params.id,
        invitedById,
        expiresAt,
        status: "PENDING",
      },
      update: {
        invitedById,
        expiresAt,
        status: "PENDING",
        token: crypto.randomUUID(),
      },
    })

    set.status = 201
    return invitation
  })
  .get("/:id/invitations", async ({ params }) => {
    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId: params.id, status: "PENDING" },
    })
    return invitations
  })
  .delete("/:id/invitations/:invitationId", async ({ params, set }) => {
    try {
      await prisma.workspaceInvitation.delete({
        where: { id: params.invitationId, workspaceId: params.id },
      })
      return { success: true }
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") ||
        (error instanceof Error && error.message.includes("Record to delete does not exist"))
      ) {
        set.status = 404
        return errorResponse("NOT_FOUND", "Invitation not found")
      }
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not cancel invitation")
    }
  })
  .delete("/:id/members/:memberId", async ({ params, query, set }) => {
    const parsedQuery = removeMemberQuerySchema.safeParse(query)
    if (!parsedQuery.success) {
      set.status = 400
      return errorResponse("VALIDATION_ERROR", "actorId query param is required")
    }

    const { actorId } = parsedQuery.data

    const workspace = await prisma.workspace.findUnique({ where: { id: params.id } })
    if (!workspace) {
      set.status = 404
      return errorResponse("NOT_FOUND", "Workspace not found")
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { id: params.memberId },
    })
    if (!member) {
      set.status = 404
      return errorResponse("NOT_FOUND", "Member not found")
    }

    if (actorId !== workspace.ownerId && actorId !== member.userId) {
      set.status = 403
      return errorResponse("FORBIDDEN", "Not authorized to remove this member")
    }

    try {
      await prisma.workspaceMember.delete({ where: { id: params.memberId } })
      return { success: true }
    } catch (error: unknown) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") ||
        (error instanceof Error && error.message.includes("Record to delete does not exist"))
      ) {
        set.status = 404
        return errorResponse("NOT_FOUND", "Member not found")
      }
      set.status = 500
      return errorResponse("INTERNAL_ERROR", "Could not remove member")
    }
  })

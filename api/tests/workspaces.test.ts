import { beforeEach, describe, expect, it, vi } from "vitest"

vi.stubEnv("INTERNAL_API_KEY", "test-api-key")

type InMemoryWorkspace = {
  id: string
  name: string
  ownerId: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

type InMemoryMember = {
  id: string
  workspaceId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

type InMemoryInvitation = {
  id: string
  email: string
  workspaceId: string
  invitedById: string
  token: string
  status: "PENDING" | "ACCEPTED" | "EXPIRED"
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

type InMemorySettings = {
  id: string
  workspacesEnabled: boolean
  instanceName: string | null
  passwordMinLength: number
  requireSpecial: boolean
  requireNumber: boolean
  requireUppercase: boolean
  requireLowercase: boolean
  basicAuthEnabled: boolean
  googleAuthEnabled: boolean
  googleClientId: string | null
  googleClientSecret: string | null
  googleClientIdEncrypted: string | null
  googleClientSecretEncrypted: string | null
  googleCredentialsIv: string | null
  createdAt: Date
  updatedAt: Date
}

const workspaces: InMemoryWorkspace[] = []
const members: InMemoryMember[] = []
const invitations: InMemoryInvitation[] = []
const settings: InMemorySettings[] = []

vi.mock("@/lib/db", () => {
  const prisma = {
    workspace: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const ws: InMemoryWorkspace = {
          id: crypto.randomUUID(),
          name: data.name as string,
          ownerId: data.ownerId as string,
          isDefault: (data.isDefault as boolean) ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        workspaces.push(ws)
        return ws
      }),
      findMany: vi.fn(async ({ where, include, skip = 0, take = 20 }: { where?: Record<string, unknown>; include?: Record<string, unknown>; skip?: number; take?: number }) => {
        let collection = [...workspaces]
        const memberFilter = (where as { members?: { some?: { userId?: string } } })?.members?.some?.userId
        if (memberFilter) {
          const memberWorkspaceIds = members
            .filter((m) => m.userId === memberFilter)
            .map((m) => m.workspaceId)
          collection = collection.filter((ws) => memberWorkspaceIds.includes(ws.id))
        }
        return collection.slice(skip, skip + take)
      }),
      count: vi.fn(async ({ where }: { where?: Record<string, unknown> }) => {
        const memberFilter = (where as { members?: { some?: { userId?: string } } })?.members?.some?.userId
        if (memberFilter) {
          const memberWorkspaceIds = members
            .filter((m) => m.userId === memberFilter)
            .map((m) => m.workspaceId)
          return workspaces.filter((ws) => memberWorkspaceIds.includes(ws.id)).length
        }
        return workspaces.length
      }),
      findUnique: vi.fn(async ({ where, include }: { where: { id: string }; include?: Record<string, unknown> }) => {
        const ws = workspaces.find((w) => w.id === where.id)
        if (!ws) return null
        if (!include) return ws
        return {
          ...ws,
          owner: { id: ws.ownerId, name: "Test Owner", email: "owner@example.com" },
          members: members
            .filter((m) => m.workspaceId === ws.id)
            .map((m) => ({ ...m, user: { id: m.userId, name: "User", email: `user-${m.userId}@example.com` } })),
          invitations: invitations.filter((i) => i.workspaceId === ws.id && i.status === "PENDING"),
        }
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = workspaces.findIndex((w) => w.id === where.id)
        if (idx < 0) throw new Error("Record to update not found")
        workspaces[idx] = { ...workspaces[idx], ...data, updatedAt: new Date() } as InMemoryWorkspace
        return workspaces[idx]
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const idx = workspaces.findIndex((w) => w.id === where.id)
        if (idx < 0) throw new Error("Record to delete does not exist")
        workspaces.splice(idx, 1)
      }),
    },
    workspaceMember: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const existing = members.find(
          (m) => m.workspaceId === data.workspaceId && m.userId === data.userId,
        )
        if (existing) throw new Error("Unique constraint")
        const member: InMemoryMember = {
          id: crypto.randomUUID(),
          workspaceId: data.workspaceId as string,
          userId: data.userId as string,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        members.push(member)
        return member
      }),
      findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
        return members.find((m) => m.id === where.id) ?? null
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const idx = members.findIndex((m) => m.id === where.id)
        if (idx < 0) throw new Error("Record to delete does not exist")
        members.splice(idx, 1)
      }),
    },
    workspaceInvitation: {
      upsert: vi.fn(async ({ where, create, update }: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const workspaceId = (where as { workspaceId_email: { workspaceId: string; email: string } }).workspaceId_email.workspaceId
        const email = (where as { workspaceId_email: { workspaceId: string; email: string } }).workspaceId_email.email
        const idx = invitations.findIndex((i) => i.workspaceId === workspaceId && i.email === email)
        if (idx >= 0) {
          invitations[idx] = { ...invitations[idx], ...update, updatedAt: new Date() } as InMemoryInvitation
          return invitations[idx]
        }
        const inv: InMemoryInvitation = {
          id: crypto.randomUUID(),
          email: create.email as string,
          workspaceId: create.workspaceId as string,
          invitedById: create.invitedById as string,
          token: crypto.randomUUID(),
          status: "PENDING",
          expiresAt: create.expiresAt as Date,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        invitations.push(inv)
        return inv
      }),
      findUnique: vi.fn(async ({ where }: { where: { token?: string; id?: string }; include?: Record<string, unknown> }) => {
        if (where.token) {
          const inv = invitations.find((i) => i.token === where.token)
          if (!inv) return null
          const ws = workspaces.find((w) => w.id === inv.workspaceId)
          return {
            ...inv,
            workspace: ws ? { id: ws.id, name: ws.name } : null,
            invitedBy: { id: inv.invitedById, name: "Inviter" },
          }
        }
        return invitations.find((i) => i.id === where.id) ?? null
      }),
      findMany: vi.fn(async ({ where }: { where?: Record<string, unknown> }) => {
        return invitations.filter((i) => {
          if (where?.workspaceId && i.workspaceId !== where.workspaceId) return false
          if (where?.status && i.status !== where.status) return false
          return true
        })
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = invitations.findIndex((i) => i.id === where.id)
        if (idx < 0) throw new Error("Record to update not found")
        invitations[idx] = { ...invitations[idx], ...data, updatedAt: new Date() } as InMemoryInvitation
        return invitations[idx]
      }),
      delete: vi.fn(async ({ where }: { where: { id: string; workspaceId: string } }) => {
        const idx = invitations.findIndex((i) => i.id === where.id && i.workspaceId === where.workspaceId)
        if (idx < 0) throw new Error("Record to delete does not exist")
        invitations.splice(idx, 1)
      }),
    },
    appSettings: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return settings.find((s) => s.id === where.id) ?? null
      }),
      upsert: vi.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const idx = settings.findIndex((s) => s.id === "default")
        if (idx >= 0) {
          settings[idx] = { ...settings[idx], ...update, updatedAt: new Date() }
          return settings[idx]
        }
        const created: InMemorySettings = {
          id: "default",
          workspacesEnabled: (create.workspacesEnabled as boolean) ?? true,
          instanceName: null,
          passwordMinLength: 8,
          requireSpecial: false,
          requireNumber: false,
          requireUppercase: false,
          requireLowercase: false,
          basicAuthEnabled: true,
          googleAuthEnabled: false,
          googleClientId: null,
          googleClientSecret: null,
          googleClientIdEncrypted: null,
          googleClientSecretEncrypted: null,
          googleCredentialsIv: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        settings.push(created)
        return created
      }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        workspace: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
            const ws: InMemoryWorkspace = {
              id: crypto.randomUUID(),
              name: data.name as string,
              ownerId: data.ownerId as string,
              isDefault: (data.isDefault as boolean) ?? false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            workspaces.push(ws)
            return ws
          }),
        },
        workspaceMember: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
            const existing = members.find(
              (m) => m.workspaceId === data.workspaceId && m.userId === data.userId,
            )
            if (existing) throw new Error("Unique constraint")
            const member: InMemoryMember = {
              id: crypto.randomUUID(),
              workspaceId: data.workspaceId as string,
              userId: data.userId as string,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            members.push(member)
            return member
          }),
        },
        workspaceInvitation: {
          update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
            const idx = invitations.findIndex((i) => i.id === where.id)
            if (idx < 0) throw new Error("Record to update not found")
            invitations[idx] = { ...invitations[idx], ...data, updatedAt: new Date() } as InMemoryInvitation
            return invitations[idx]
          }),
        },
      })
    }),
  }

  return { prisma }
})

import { app } from "@/app"

const API_KEY = "test-api-key"

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { "x-internal-api-key": API_KEY, ...extra }
}

describe("workspaces api", () => {
  beforeEach(() => {
    workspaces.length = 0
    members.length = 0
    invitations.length = 0
    settings.length = 0
  })

  it("creates workspace and auto-adds owner as member", async () => {
    const response = await app.handle(
      new Request("http://localhost/v1/workspaces", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "Test Workspace", ownerId: "user-1" }),
      }),
    )
    expect(response.status).toBe(201)
    const data = (await response.json()) as InMemoryWorkspace
    expect(data.name).toBe("Test Workspace")
    expect(data.ownerId).toBe("user-1")
    expect(workspaces).toHaveLength(1)
    expect(members).toHaveLength(1)
    expect(members[0]?.userId).toBe("user-1")
  })

  it("returns 403 when workspacesEnabled=false for non-default workspace", async () => {
    settings.push({
      id: "default",
      workspacesEnabled: false,
      instanceName: null,
      passwordMinLength: 8,
      requireSpecial: false,
      requireNumber: false,
      requireUppercase: false,
      requireLowercase: false,
      basicAuthEnabled: true,
      googleAuthEnabled: false,
      googleClientId: null,
      googleClientSecret: null,
      googleClientIdEncrypted: null,
      googleClientSecretEncrypted: null,
      googleCredentialsIv: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "New WS", ownerId: "user-1" }),
      }),
    )
    expect(response.status).toBe(403)
  })

  it("creates default workspace regardless of workspacesEnabled flag", async () => {
    settings.push({
      id: "default",
      workspacesEnabled: false,
      instanceName: null,
      passwordMinLength: 8,
      requireSpecial: false,
      requireNumber: false,
      requireUppercase: false,
      requireLowercase: false,
      basicAuthEnabled: true,
      googleAuthEnabled: false,
      googleClientId: null,
      googleClientSecret: null,
      googleClientIdEncrypted: null,
      googleClientSecretEncrypted: null,
      googleCredentialsIv: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "Default WS", ownerId: "user-1", isDefault: true }),
      }),
    )
    expect(response.status).toBe(201)
  })

  it("lists paginated workspaces by userId", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    members.push({
      id: "m-1",
      workspaceId: "ws-1",
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces?userId=user-1", {
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(200)
    const data = (await response.json()) as { items: InMemoryWorkspace[]; total: number }
    expect(data.total).toBe(1)
    expect(data.items[0]?.id).toBe("ws-1")
  })

  it("returns 400 when userId missing", async () => {
    const response = await app.handle(
      new Request("http://localhost/v1/workspaces", {
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(400)
  })

  it("gets workspace with members and invitations", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-1", {
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(200)
    const data = (await response.json()) as { name: string; members: unknown[]; invitations: unknown[] }
    expect(data.name).toBe("WS 1")
    expect(Array.isArray(data.members)).toBe(true)
    expect(Array.isArray(data.invitations)).toBe(true)
  })

  it("returns 404 for unknown workspace", async () => {
    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/unknown-id", {
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(404)
  })

  it("renames workspace", async () => {
    workspaces.push({
      id: "ws-1",
      name: "Old Name",
      ownerId: "user-1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-1", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "New Name" }),
      }),
    )
    expect(response.status).toBe(200)
    const data = (await response.json()) as InMemoryWorkspace
    expect(data.name).toBe("New Name")
  })

  it("deletes non-default workspace", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-1", {
        method: "DELETE",
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(200)
    expect(workspaces).toHaveLength(0)
  })

  it("returns 403 when deleting default workspace", async () => {
    workspaces.push({
      id: "ws-default",
      name: "Default WS",
      ownerId: "user-1",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-default", {
        method: "DELETE",
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(403)
    const data = (await response.json()) as { code: string }
    expect(data.code).toBe("CANNOT_DELETE_DEFAULT")
  })

  it("creates invitation (upserts) and returns 201", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-1/invitations", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({
          email: "invite@example.com",
          invitedById: "user-1",
          inviterName: "Test User",
          workspaceName: "WS 1",
        }),
      }),
    )
    expect(response.status).toBe(201)
    const data = (await response.json()) as InMemoryInvitation
    expect(data.email).toBe("invite@example.com")
    expect(data.status).toBe("PENDING")
  })

  it("returns 404 if token not found when resolving", async () => {
    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/invitations/bad-token", {
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(404)
  })

  it("returns 410 EXPIRED when invitation is expired", async () => {
    invitations.push({
      id: "inv-1",
      email: "test@example.com",
      workspaceId: "ws-1",
      invitedById: "user-1",
      token: "expired-token",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/invitations/expired-token", {
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(410)
    const data = (await response.json()) as { code: string }
    expect(data.code).toBe("EXPIRED")
  })

  it("accepts invitation and creates WorkspaceMember", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    invitations.push({
      id: "inv-1",
      email: "newuser@example.com",
      workspaceId: "ws-1",
      invitedById: "user-1",
      token: "valid-token",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/invitations/valid-token/accept", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ userId: "user-2" }),
      }),
    )
    expect(response.status).toBe(200)
    const data = (await response.json()) as { workspaceId: string }
    expect(data.workspaceId).toBe("ws-1")
  })

  it("cancels invitation", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    invitations.push({
      id: "inv-1",
      email: "someone@example.com",
      workspaceId: "ws-1",
      invitedById: "user-1",
      token: "some-token",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-1/invitations/inv-1", {
        method: "DELETE",
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(200)
    expect(invitations).toHaveLength(0)
  })

  it("removes member (owner action)", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    members.push({
      id: "member-1",
      workspaceId: "ws-1",
      userId: "user-2",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-1/members/member-1?actorId=user-1", {
        method: "DELETE",
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(200)
    expect(members).toHaveLength(0)
  })

  it("returns 403 when non-owner tries to remove other member", async () => {
    workspaces.push({
      id: "ws-1",
      name: "WS 1",
      ownerId: "user-1",
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    members.push({
      id: "member-1",
      workspaceId: "ws-1",
      userId: "user-2",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await app.handle(
      new Request("http://localhost/v1/workspaces/ws-1/members/member-1?actorId=user-3", {
        method: "DELETE",
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(403)
  })

  it("validates create payload", async () => {
    const response = await app.handle(
      new Request("http://localhost/v1/workspaces", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "", ownerId: "" }),
      }),
    )
    expect(response.status).toBe(400)
  })
})

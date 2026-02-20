import { beforeEach, describe, expect, it, vi } from "vitest"

vi.stubEnv("INTERNAL_API_KEY", "test-api-key")

type InMemoryUser = {
  id: string
  name: string
  email: string
  status: "ENABLED" | "DISABLED"
  admin: boolean
  authMethod: "BASIC" | "GOOGLE"
  createdAt: Date
  updatedAt: Date
}

const users: InMemoryUser[] = []
const workspaces: { id: string; name: string; ownerId: string; isDefault: boolean }[] = []
const members: { id: string; workspaceId: string; userId: string }[] = []

vi.mock("@/lib/db", () => {
  const prisma = {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        user: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
            const duplicate = users.find((u) => u.email === data.email)
            if (duplicate) throw new Error("Unique constraint")
            const created: InMemoryUser = {
              id: crypto.randomUUID(),
              name: data.name as string,
              email: data.email as string,
              status: (data.status as "ENABLED" | "DISABLED") ?? "ENABLED",
              admin: (data.admin as boolean) ?? false,
              authMethod: (data.authMethod as "BASIC" | "GOOGLE") ?? "BASIC",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            users.unshift(created)
            return created
          }),
        },
        workspace: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
            const ws = { id: crypto.randomUUID(), name: data.name as string, ownerId: data.ownerId as string, isDefault: (data.isDefault as boolean) ?? false }
            workspaces.push(ws)
            return ws
          }),
        },
        workspaceMember: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
            const member = { id: crypto.randomUUID(), workspaceId: data.workspaceId as string, userId: data.userId as string }
            members.push(member)
            return member
          }),
        },
      })
    }),
    workspace: {
      create: vi.fn(),
    },
    workspaceMember: {
      create: vi.fn(),
    },
    appSettings: {
      findUnique: vi.fn(async () => null),
    },
    user: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const duplicate = users.find((user) => user.email === data.email)
        if (duplicate) {
          throw new Error("Unique constraint")
        }
        const created: InMemoryUser = {
          id: crypto.randomUUID(),
          name: data.name as string,
          email: data.email as string,
          status: (data.status as "ENABLED" | "DISABLED") ?? "ENABLED",
          admin: (data.admin as boolean) ?? false,
          authMethod: (data.authMethod as "BASIC" | "GOOGLE") ?? "BASIC",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        users.unshift(created)
        return created
      }),
      findMany: vi.fn(async ({ where, skip, take }: { where?: Record<string, unknown>; skip?: number; take?: number }) => {
        let collection = [...users]
        if (where?.status) {
          collection = collection.filter((item) => item.status === where.status)
        }
        if (where?.OR && Array.isArray(where.OR) && where.OR.length) {
          const search = (where.OR[0] as { name: { contains: string } }).name.contains.toLowerCase()
          collection = collection.filter(
            (item) =>
              item.name.toLowerCase().includes(search) ||
              item.email.toLowerCase().includes(search),
          )
        }
        return collection.slice(skip, skip && take ? skip + take : take)
      }),
      count: vi.fn(async ({ where }: { where?: Record<string, unknown> }) => {
        if (!where?.status) return users.length
        return users.filter((item) => item.status === where.status).length
      }),
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) {
          return users.find((user) => user.id === where.id) ?? null
        }
        return users.find((user) => user.email === where.email) ?? null
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const index = users.findIndex((user) => user.id === where.id)
        if (index < 0) {
          throw new Error("Record to update not found")
        }
        if (data.email && users.some((user) => user.email === data.email && user.id !== where.id)) {
          throw new Error("Unique constraint")
        }
        users[index] = {
          ...users[index],
          ...data,
          updatedAt: new Date(),
        } as InMemoryUser
        return users[index]
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = users.findIndex((user) => user.id === where.id)
        if (index < 0) {
          throw new Error("Record to delete does not exist")
        }
        users.splice(index, 1)
      }),
    },
  }

  return { prisma }
})

import { app } from "@/app"

const API_KEY = "test-api-key"

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { "x-internal-api-key": API_KEY, ...extra }
}

describe("api", () => {
  beforeEach(() => {
    users.length = 0
    workspaces.length = 0
    members.length = 0
  })

  it("returns health status", async () => {
    const response = await app.handle(new Request("http://localhost/health"))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("creates and lists users", async () => {
    const create = await app.handle(
      new Request("http://localhost/v1/users", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "Jane", email: "jane@example.com" }),
      }),
    )
    expect(create.status).toBe(201)

    const list = await app.handle(
      new Request("http://localhost/v1/users?page=1&pageSize=20", {
        headers: authHeaders(),
      }),
    )
    expect(list.status).toBe(200)
    const payload = (await list.json()) as { items: InMemoryUser[]; total: number }
    expect(payload.total).toBe(1)
    expect(payload.items[0]?.email).toBe("jane@example.com")
  })

  it("validates create payload", async () => {
    const create = await app.handle(
      new Request("http://localhost/v1/users", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "", email: "wrong" }),
      }),
    )
    expect(create.status).toBe(400)
  })

  it("updates and deletes a user", async () => {
    const create = await app.handle(
      new Request("http://localhost/v1/users", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "John", email: "john@example.com" }),
      }),
    )
    const created = (await create.json()) as InMemoryUser

    const patch = await app.handle(
      new Request(`http://localhost/v1/users/${created.id}`, {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ status: "DISABLED", admin: true }),
      }),
    )
    expect(patch.status).toBe(200)
    const updated = (await patch.json()) as InMemoryUser
    expect(updated.status).toBe("DISABLED")
    expect(updated.admin).toBe(true)

    const del = await app.handle(
      new Request(`http://localhost/v1/users/${created.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }),
    )
    expect(del.status).toBe(200)
  })

  it("returns not found for unknown user id", async () => {
    const getById = await app.handle(
      new Request("http://localhost/v1/users/missing", {
        headers: authHeaders(),
      }),
    )
    expect(getById.status).toBe(404)

    const patch = await app.handle(
      new Request("http://localhost/v1/users/missing", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "X" }),
      }),
    )
    expect(patch.status).toBe(404)

    const del = await app.handle(
      new Request("http://localhost/v1/users/missing", {
        method: "DELETE",
        headers: authHeaders(),
      }),
    )
    expect(del.status).toBe(404)
  })

  it("filters users by status and search", async () => {
    await app.handle(
      new Request("http://localhost/v1/users", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "Enabled User", email: "enabled@example.com", status: "ENABLED" }),
      }),
    )
    await app.handle(
      new Request("http://localhost/v1/users", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "Disabled User", email: "disabled@example.com", status: "DISABLED" }),
      }),
    )

    const list = await app.handle(
      new Request("http://localhost/v1/users?page=1&pageSize=20&status=DISABLED&search=disabled", {
        headers: authHeaders(),
      }),
    )
    expect(list.status).toBe(200)
    const payload = (await list.json()) as { items: InMemoryUser[]; total: number }
    expect(payload.total).toBe(1)
    expect(payload.items[0]?.status).toBe("DISABLED")
  })

  it("validates query and patch payload", async () => {
    const query = await app.handle(
      new Request("http://localhost/v1/users?page=0", {
        headers: authHeaders(),
      }),
    )
    expect(query.status).toBe(400)

    const patch = await app.handle(
      new Request("http://localhost/v1/users/user-id", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ email: "not-email" }),
      }),
    )
    expect(patch.status).toBe(400)
  })

  it("returns conflict for duplicate email", async () => {
    await app.handle(
      new Request("http://localhost/v1/users", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "A", email: "dup@example.com" }),
      }),
    )

    const create = await app.handle(
      new Request("http://localhost/v1/users", {
        method: "POST",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ name: "B", email: "dup@example.com" }),
      }),
    )

    expect(create.status).toBe(409)
  })
})

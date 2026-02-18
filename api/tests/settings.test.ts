import { beforeEach, describe, expect, it, vi } from "vitest"

vi.stubEnv("INTERNAL_API_KEY", "test-api-key")

type SettingsRecord = {
  id: string
  instanceName: string | null
  passwordMinLength: number
  requireSpecial: boolean
  requireNumber: boolean
  requireUppercase: boolean
  requireLowercase: boolean
  googleClientId: string | null
  googleClientSecret: string | null
  createdAt?: Date
  updatedAt?: Date
}

const settings: SettingsRecord[] = []

vi.mock("@/lib/db", () => {
  const prisma = {
    appSettings: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return settings.find((s) => s.id === where.id) ?? null
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const created: SettingsRecord = {
          id: "default",
          instanceName: (data.instanceName as string | null) ?? null,
          passwordMinLength: (data.passwordMinLength as number) ?? 8,
          requireSpecial: (data.requireSpecial as boolean) ?? false,
          requireNumber: (data.requireNumber as boolean) ?? false,
          requireUppercase: (data.requireUppercase as boolean) ?? false,
          requireLowercase: (data.requireLowercase as boolean) ?? false,
          googleClientId: (data.googleClientId as string | null) ?? null,
          googleClientSecret: (data.googleClientSecret as string | null) ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        settings.push(created)
        return created
      }),
      upsert: vi.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const idx = settings.findIndex((s) => s.id === "default")
        if (idx >= 0) {
          settings[idx] = { ...settings[idx], ...update, updatedAt: new Date() }
          return settings[idx]
        }
        const created: SettingsRecord = {
          id: "default",
          instanceName: (create.instanceName as string | null) ?? null,
          passwordMinLength: (create.passwordMinLength as number) ?? 8,
          requireSpecial: (create.requireSpecial as boolean) ?? false,
          requireNumber: (create.requireNumber as boolean) ?? false,
          requireUppercase: (create.requireUppercase as boolean) ?? false,
          requireLowercase: (create.requireLowercase as boolean) ?? false,
          googleClientId: (create.googleClientId as string | null) ?? null,
          googleClientSecret: (create.googleClientSecret as string | null) ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        settings.push(created)
        return created
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

describe("settings api", () => {
  beforeEach(() => {
    settings.length = 0
  })

  it("returns default settings when none exist", async () => {
    const response = await app.handle(
      new Request("http://localhost/v1/settings", {
        headers: authHeaders(),
      }),
    )
    expect(response.status).toBe(200)
    const data = (await response.json()) as Record<string, unknown>
    expect(data.instanceName).toBeNull()
    expect(data.passwordMinLength).toBe(8)
  })

  it("updates general settings", async () => {
    const patch = await app.handle(
      new Request("http://localhost/v1/settings/general", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ instanceName: "My App" }),
      }),
    )
    expect(patch.status).toBe(200)
    const data = (await patch.json()) as Record<string, unknown>
    expect(data.instanceName).toBe("My App")
  })

  it("updates basic auth settings", async () => {
    const patch = await app.handle(
      new Request("http://localhost/v1/settings/auth/basic", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ passwordMinLength: 12, requireSpecial: true }),
      }),
    )
    expect(patch.status).toBe(200)
    const data = (await patch.json()) as Record<string, unknown>
    expect(data.passwordMinLength).toBe(12)
    expect(data.requireSpecial).toBe(true)
  })

  it("updates google auth settings", async () => {
    const patch = await app.handle(
      new Request("http://localhost/v1/settings/auth/google", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ googleClientId: "my-client-id" }),
      }),
    )
    expect(patch.status).toBe(200)
    const data = (await patch.json()) as Record<string, unknown>
    expect(data.googleClientId).toBe("my-client-id")
  })

  it("validates general settings payload", async () => {
    const patch = await app.handle(
      new Request("http://localhost/v1/settings/general", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ instanceName: "" }),
      }),
    )
    expect(patch.status).toBe(400)
  })

  it("validates basic auth settings payload", async () => {
    const patch = await app.handle(
      new Request("http://localhost/v1/settings/auth/basic", {
        method: "PATCH",
        headers: authHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ passwordMinLength: 3 }),
      }),
    )
    expect(patch.status).toBe(400)
  })
})

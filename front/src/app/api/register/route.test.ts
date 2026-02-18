import { beforeEach, describe, expect, it, vi } from "vitest"

const { findUnique, create, hash, appSettingsFindUnique } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  hash: vi.fn(),
  appSettingsFindUnique: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique,
      create,
    },
    appSettings: {
      findUnique: appSettingsFindUnique,
    },
  },
}))

vi.mock("bcryptjs", () => ({
  default: {
    hash,
  },
}))

import { POST } from "./route"

describe("register route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appSettingsFindUnique.mockResolvedValue({
      passwordMinLength: 8,
      requireSpecial: false,
      requireNumber: false,
      requireUppercase: false,
      requireLowercase: false,
    })
  })

  it("creates user from valid payload", async () => {
    findUnique.mockResolvedValue(null)
    hash.mockResolvedValue("hashed")
    create.mockResolvedValue({
      id: "1",
      name: "Jane",
      email: "jane@example.com",
      status: "ENABLED",
      admin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Jane",
          email: "jane@example.com",
          password: "password123",
        }),
      }),
    )

    expect(response.status).toBe(201)
  })

  it("returns conflict for duplicate email", async () => {
    findUnique.mockResolvedValue({ id: "existing" })

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Jane",
          email: "jane@example.com",
          password: "password123",
        }),
      }),
    )

    expect(response.status).toBe(409)
  })

  it("validates password length from settings", async () => {
    appSettingsFindUnique.mockResolvedValue({
      passwordMinLength: 12,
      requireSpecial: false,
      requireNumber: false,
      requireUppercase: false,
      requireLowercase: false,
    })
    findUnique.mockResolvedValue(null)

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Jane",
          email: "jane@example.com",
          password: "short",
        }),
      }),
    )

    expect(response.status).toBe(400)
  })

  it("validates password requirements from settings", async () => {
    appSettingsFindUnique.mockResolvedValue({
      passwordMinLength: 8,
      requireSpecial: true,
      requireNumber: true,
      requireUppercase: true,
      requireLowercase: true,
    })
    findUnique.mockResolvedValue(null)

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Jane",
          email: "jane@example.com",
          password: "password",
        }),
      }),
    )

    expect(response.status).toBe(400)
  })
})

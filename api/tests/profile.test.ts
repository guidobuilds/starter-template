import { describe, it, expect, vi, beforeEach } from "vitest"

vi.stubEnv("INTERNAL_API_KEY", "test-api-key")

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    appSettings: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/db"
import { app } from "@/app"

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { "x-internal-api-key": "test-api-key", ...extra }
}

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: null,
  image: null,
  passwordHash: null,
  status: "ENABLED" as const,
  admin: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

describe("Profile Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /v1/profile/:id", () => {
    it("returns user profile", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

      const response = await app
        .handle(new Request("http://localhost/v1/profile/user-1", { method: "GET", headers: authHeaders() }))
        .then((r) => r.json())

      expect(response).toMatchObject({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      })
    })

    it("returns 404 for non-existent user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const response = await app
        .handle(new Request("http://localhost/v1/profile/nonexistent", { method: "GET", headers: authHeaders() }))
        .then((r) => r.json())

      expect(response).toMatchObject({
        code: "NOT_FOUND",
      })
    })
  })

  describe("PATCH /v1/profile/:id", () => {
    it("updates user name", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        name: "Updated Name",
        updatedAt: new Date("2024-01-02"),
      })

      const response = await app
        .handle(
          new Request("http://localhost/v1/profile/user-1", {
            method: "PATCH",
            headers: authHeaders({ "content-type": "application/json" }),
            body: JSON.stringify({ name: "Updated Name" }),
          })
        )
        .then((r) => r.json())

      expect(response).toMatchObject({
        name: "Updated Name",
      })
    })

    it("returns 409 for duplicate email", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockUser,
        id: "other-user",
        name: "Other",
        email: "existing@example.com",
      })

      const response = await app
        .handle(
          new Request("http://localhost/v1/profile/user-1", {
            method: "PATCH",
            headers: authHeaders({ "content-type": "application/json" }),
            body: JSON.stringify({ email: "existing@example.com" }),
          })
        )
        .then((r) => r.json())

      expect(response).toMatchObject({
        code: "EMAIL_CONFLICT",
      })
    })
  })
})

import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`Redirect to ${path}`)
  }),
}))

const mockAuth = vi.fn()

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}))

describe("HomePage redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects admin users to /admin/users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "admin@example.com", admin: true },
    })

    const { default: HomePage } = await import("./page")

    await expect(HomePage()).rejects.toThrow("Redirect to /admin/users")
  })

  it("redirects non-admin users to /quotes/overview", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "2", email: "user@example.com", admin: false },
    })

    const { default: HomePage } = await import("./page")

    await expect(HomePage()).rejects.toThrow("Redirect to /quotes/overview")
  })

  it("redirects unauthenticated users to /login", async () => {
    mockAuth.mockResolvedValue(null)

    const { default: HomePage } = await import("./page")

    await expect(HomePage()).rejects.toThrow("Redirect to /login")
  })
})

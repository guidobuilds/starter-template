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

vi.mock("@/components/auth/AuthCard", () => ({
  AuthCard: () => <div data-testid="auth-card">AuthCard</div>,
}))

describe("LoginPage redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects admin users to /admin/users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "admin@example.com", admin: true },
    })

    const { default: LoginPage } = await import("./page")

    await expect(LoginPage()).rejects.toThrow("Redirect to /admin/users")
  })

  it("redirects non-admin users to /quotes/overview", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "2", email: "user@example.com", admin: false },
    })

    const { default: LoginPage } = await import("./page")

    await expect(LoginPage()).rejects.toThrow("Redirect to /quotes/overview")
  })

  it("renders AuthCard for unauthenticated users", async () => {
    mockAuth.mockResolvedValue(null)

    const { default: LoginPage } = await import("./page")

    const result = await LoginPage()
    expect(result).toBeDefined()
  })
})

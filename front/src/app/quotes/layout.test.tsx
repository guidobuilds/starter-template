import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`Redirect to ${path}`)
  }),
}))

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}))

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: vi.fn().mockReturnValue({ value: "true" }),
    }),
}))

vi.mock("./QuotesLayoutClient", () => ({
  QuotesLayoutClient: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockAuth = vi.fn()

describe("QuotesLayout auth protection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects unauthenticated users to /login", async () => {
    mockAuth.mockResolvedValue(null)

    const { default: QuotesLayout } = await import("./layout")

    await expect(QuotesLayout({ children: <div>Test</div> })).rejects.toThrow("Redirect to /login")
  })

  it("renders content for authenticated users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "user@example.com", admin: false },
    })

    const { default: QuotesLayout } = await import("./layout")

    const result = await QuotesLayout({ children: <div>Quotes Content</div> })
    expect(result).toBeDefined()
  })

  it("renders content for authenticated admin users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "admin@example.com", admin: true },
    })

    const { default: QuotesLayout } = await import("./layout")

    const result = await QuotesLayout({ children: <div>Quotes Content</div> })
    expect(result).toBeDefined()
  })
})

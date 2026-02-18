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

vi.mock("@/components/Sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarTrigger: () => <button>Toggle</button>,
}))

vi.mock("@/components/ui/navigation/AppSidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>,
}))

vi.mock("@/components/ui/navigation/Breadcrumbs", () => ({
  Breadcrumbs: () => <div>Breadcrumbs</div>,
}))

const mockAuth = vi.fn()
const mockCookies = vi.fn()

vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}))

describe("AdminLayout redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects unauthenticated users to /", async () => {
    mockAuth.mockResolvedValue(null)

    const { default: AdminLayout } = await import("./layout")

    await expect(AdminLayout({ children: <div>Test</div> })).rejects.toThrow("Redirect to /")
  })

  it("redirects non-admin users to /quotes/overview", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "2", email: "user@example.com", admin: false },
    })

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "true" }),
    })

    const { default: AdminLayout } = await import("./layout")

    await expect(AdminLayout({ children: <div>Test</div> })).rejects.toThrow(
      "Redirect to /quotes/overview",
    )
  })

  it("renders admin content for admin users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "admin@example.com", admin: true },
    })

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "true" }),
    })

    const { default: AdminLayout } = await import("./layout")

    const result = await AdminLayout({ children: <div>Admin Content</div> })
    expect(result).toBeDefined()
  })
})

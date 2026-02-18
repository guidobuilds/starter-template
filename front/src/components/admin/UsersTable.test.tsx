import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UsersTable } from "./UsersTable"

const mockListUsers = vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })

vi.mock("@/lib/api/users", () => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  listUsers: () => mockListUsers(),
  updateUser: vi.fn(),
}))

describe("UsersTable", () => {
  beforeEach(() => {
    mockListUsers.mockClear()
  })

  it("renders default columns", async () => {
    mockListUsers.mockResolvedValueOnce({
      items: [
        {
          id: "u1",
          name: "Jane",
          email: "jane@example.com",
          status: "ENABLED",
          admin: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    })

    render(
      <UsersTable
        initialUsers={[]}
        initialTotal={0}
        initialPage={1}
        initialPageSize={20}
      />,
    )

    expect(screen.getByText("Users")).toBeInTheDocument()
    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("Admin")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("jane@example.com")).toBeInTheDocument()
    })
  })

  it("renders add user button", () => {
    render(
      <UsersTable initialUsers={[]} initialTotal={0} initialPage={1} initialPageSize={20} />,
    )

    expect(screen.getAllByText("Add user").length).toBeGreaterThan(0)
  })

  it("shows pagination info when there are users", async () => {
    mockListUsers.mockResolvedValueOnce({
      items: [
        {
          id: "u1",
          name: "Jane",
          email: "jane@example.com",
          status: "ENABLED",
          admin: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 25,
      page: 1,
      pageSize: 20,
    })

    render(
      <UsersTable
        initialUsers={[]}
        initialTotal={0}
        initialPage={1}
        initialPageSize={20}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText(/25 total/)).toBeInTheDocument()
    })
  })

  it("shows empty state when no users", async () => {
    mockListUsers.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })

    render(
      <UsersTable initialUsers={[]} initialTotal={0} initialPage={1} initialPageSize={20} />,
    )

    await waitFor(() => {
      expect(screen.getAllByText("No users found").length).toBeGreaterThan(0)
    })
  })
})

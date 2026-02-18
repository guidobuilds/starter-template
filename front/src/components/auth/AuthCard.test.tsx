import React from "react"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { AuthCard } from "./AuthCard"

const { mockPush, mockRefresh, mockSignIn } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignIn: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}))

describe("AuthCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("redirects to / after successful credentials sign in", async () => {
    mockSignIn.mockResolvedValue({ error: undefined })

    render(<AuthCard />)

    const emailInput = screen.getByPlaceholderText("Email")
    const passwordInput = screen.getByPlaceholderText("Password (8+ chars)")
    const submitButton = screen.getByRole("button", { name: /sign in with email/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "password123" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@example.com",
        password: "password123",
        redirect: false,
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it("shows error on failed credentials sign in", async () => {
    mockSignIn.mockResolvedValue({ error: "Invalid credentials" })

    render(<AuthCard />)

    const emailInput = screen.getByPlaceholderText("Email")
    const passwordInput = screen.getByPlaceholderText("Password (8+ chars)")
    const submitButton = screen.getByRole("button", { name: /sign in with email/i })

    fireEvent.change(emailInput, { target: { value: "test@example.com" } })
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials or disabled account")).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it("calls signIn with google and callbackUrl /login", () => {
    render(<AuthCard />)

    const googleButton = screen.getByRole("button", { name: /continue with google/i })
    fireEvent.click(googleButton)

    expect(mockSignIn).toHaveBeenCalledWith("google", { callbackUrl: "/login" })
  })
})

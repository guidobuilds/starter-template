import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getProfile, updateProfile, updatePassword } from "./profile"

describe("profile API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("getProfile", () => {
    it("returns profile on success", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ id: "1", name: "Test", email: "test@example.com", image: null, createdAt: "", updatedAt: "" }), {
          status: 200,
        })
      )

      const profile = await getProfile()

      expect(profile).toEqual({
        id: "1",
        name: "Test",
        email: "test@example.com",
        image: null,
        createdAt: "",
        updatedAt: "",
      })
    })

    it("throws on failure", async () => {
      vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 500 }))

      await expect(getProfile()).rejects.toThrow("Failed to fetch profile")
    })
  })

  describe("updateProfile", () => {
    it("returns updated profile on success", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ id: "1", name: "Updated", email: "test@example.com", image: null, updatedAt: "" }), {
          status: 200,
        })
      )

      const profile = await updateProfile({ name: "Updated" })

      expect(profile.name).toBe("Updated")
    })

    it("throws with error message on failure", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ message: "Email already in use" }), { status: 409 })
      )

      await expect(updateProfile({ email: "existing@example.com" })).rejects.toThrow("Email already in use")
    })
  })

  describe("updatePassword", () => {
    it("returns success on valid password update", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )

      const result = await updatePassword({ currentPassword: "old", newPassword: "newpass123" })

      expect(result).toEqual({ success: true })
    })

    it("throws with validation errors on failure", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ details: { formErrors: ["Password must be at least 8 characters"] } }), { status: 400 })
      )

      await expect(updatePassword({ currentPassword: "old", newPassword: "short" })).rejects.toThrow(
        "Password must be at least 8 characters"
      )
    })
  })
})

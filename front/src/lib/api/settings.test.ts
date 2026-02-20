import { afterEach, describe, expect, it, vi } from "vitest"
import { getSettings, updateGeneralSettings, updateBasicAuthSettings, updateGoogleAuthSettings } from "./settings"

describe("settings api client", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("fetches settings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ instanceName: "Test App", passwordMinLength: 8, requireSpecial: false, requireNumber: false, requireUppercase: false, requireLowercase: false, googleClientId: null, googleClientSecret: null }),
      }),
    )

    const settings = await getSettings()
    expect(settings.instanceName).toBe("Test App")
  })

  it("updates general settings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ instanceName: "New Name", updatedAt: new Date().toISOString() }),
      }),
    )

    const result = await updateGeneralSettings({ instanceName: "New Name" })
    expect(result.instanceName).toBe("New Name")
  })

  it("updates basic auth settings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ passwordMinLength: 12, requireSpecial: true, requireNumber: false, requireUppercase: false, requireLowercase: false, updatedAt: new Date().toISOString() }),
      }),
    )

    const result = await updateBasicAuthSettings({ passwordMinLength: 12, requireSpecial: true })
    expect(result.passwordMinLength).toBe(12)
    expect(result.requireSpecial).toBe(true)
  })

  it("updates google auth settings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ googleAuthEnabled: true, googleConfigured: true, updatedAt: new Date().toISOString() }),
      }),
    )

    const result = await updateGoogleAuthSettings({ googleAuthEnabled: true, googleClientId: "client-id" })
    expect(result.googleAuthEnabled).toBe(true)
    expect(result.googleConfigured).toBe(true)
  })

  it("throws on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false }),
    )

    await expect(getSettings()).rejects.toThrow("Failed to fetch settings")
  })
})

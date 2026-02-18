export type AppSettings = {
  instanceName: string | null
  passwordMinLength: number
  requireSpecial: boolean
  requireNumber: boolean
  requireUppercase: boolean
  requireLowercase: boolean
  googleClientId: string | null
  googleClientSecret: string | null
  createdAt: string
  updatedAt: string
}

export type GeneralSettingsPayload = {
  instanceName?: string
}

export type BasicAuthSettingsPayload = {
  passwordMinLength?: number
  requireSpecial?: boolean
  requireNumber?: boolean
  requireUppercase?: boolean
  requireLowercase?: boolean
}

export type GoogleAuthSettingsPayload = {
  googleClientId?: string | null
  googleClientSecret?: string | null
}

export async function getSettings(): Promise<AppSettings> {
  const response = await fetch("/api/settings", {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch settings")
  }
  return response.json()
}

export async function updateGeneralSettings(
  payload: GeneralSettingsPayload,
): Promise<{ instanceName: string | null; updatedAt: string }> {
  const response = await fetch("/api/settings/general", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("Failed to update general settings")
  }
  return response.json()
}

export async function updateBasicAuthSettings(
  payload: BasicAuthSettingsPayload,
): Promise<{
  passwordMinLength: number
  requireSpecial: boolean
  requireNumber: boolean
  requireUppercase: boolean
  requireLowercase: boolean
  updatedAt: string
}> {
  const response = await fetch("/api/settings/auth/basic", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("Failed to update basic auth settings")
  }
  return response.json()
}

export async function updateGoogleAuthSettings(
  payload: GoogleAuthSettingsPayload,
): Promise<{ googleClientId: string | null; googleClientSecret: string | null; updatedAt: string }> {
  const response = await fetch("/api/settings/auth/google", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("Failed to update google auth settings")
  }
  return response.json()
}

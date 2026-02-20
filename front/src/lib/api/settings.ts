export type AppSettings = {
  instanceName: string | null
  passwordMinLength: number
  requireSpecial: boolean
  requireNumber: boolean
  requireUppercase: boolean
  requireLowercase: boolean
  basicAuthEnabled: boolean
  googleAuthEnabled: boolean
  googleConfigured: boolean
  googleClientId: string | null
  googleClientSecret: string | null
  workspacesEnabled: boolean
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
  basicAuthEnabled?: boolean
}

export type GoogleAuthSettingsPayload = {
  googleAuthEnabled?: boolean
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
  basicAuthEnabled: boolean
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
): Promise<{ googleAuthEnabled: boolean; googleConfigured: boolean; updatedAt: string }> {
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

export async function updateWorkspaceSettings(payload: {
  workspacesEnabled: boolean
}): Promise<{ workspacesEnabled: boolean; updatedAt: string }> {
  const response = await fetch("/api/settings/workspaces", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("Failed to update workspace settings")
  }
  return response.json()
}

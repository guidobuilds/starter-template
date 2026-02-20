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

export type ApiErrorShape = {
  code: string
  message: string
  details?: unknown
  status?: number
}

export class ApiClientError extends Error implements ApiErrorShape {
  code: string
  details?: unknown
  status?: number

  constructor({
    code,
    message,
    details,
    status,
  }: {
    code: string
    message: string
    details?: unknown
    status?: number
  }) {
    super(message)
    this.name = "ApiClientError"
    this.code = code
    this.details = details
    this.status = status
  }
}

async function parseApiError(
  response: Response,
  fallbackMessage: string,
): Promise<ApiClientError> {
  try {
    const payload = (await response.json()) as {
      code?: string
      message?: string
      details?: unknown
    }
    return new ApiClientError({
      code: payload.code ?? "UNKNOWN_ERROR",
      message: payload.message ?? fallbackMessage,
      details: payload.details,
      status: response.status,
    })
  } catch {
    return new ApiClientError({
      code: "UNKNOWN_ERROR",
      message: fallbackMessage,
      status: response.status,
    })
  }
}

export async function getSettings(): Promise<AppSettings> {
  const response = await fetch("/api/settings", {
    cache: "no-store",
  })
  if (!response.ok) {
    throw await parseApiError(response, "Failed to fetch settings")
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
    throw await parseApiError(response, "Failed to update general settings")
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
    throw await parseApiError(response, "Failed to update basic auth settings")
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
    throw await parseApiError(response, "Failed to update google auth settings")
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
    throw await parseApiError(response, "Failed to update workspace settings")
  }
  return response.json()
}

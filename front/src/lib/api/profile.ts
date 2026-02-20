export type UserProfile = {
  id: string
  name: string
  email: string
  image: string | null
  authMethod: "BASIC" | "GOOGLE"
  createdAt: string
  updatedAt: string
}

export type UpdateProfilePayload = {
  name?: string
}

export type UpdatePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export async function getProfile(): Promise<UserProfile> {
  const response = await fetch("/api/profile", {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch profile")
  }
  return response.json()
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to update profile")
  }
  return response.json()
}

export async function updatePassword(
  payload: UpdatePasswordPayload,
): Promise<{ success: boolean }> {
  const response = await fetch("/api/profile/password", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const err = error as { message?: string; details?: { formErrors?: string[] } }
    throw new Error(err.details?.formErrors?.join(", ") ?? err.message ?? "Failed to update password")
  }
  return response.json()
}

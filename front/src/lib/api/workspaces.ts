export type Workspace = {
  id: string
  name: string
  ownerId: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  owner?: { id: string; name: string; email: string }
}

export type WorkspaceMember = {
  id: string
  workspaceId: string
  userId: string
  createdAt: string
  updatedAt: string
  user?: { id: string; name: string; email: string }
}

export type WorkspaceInvitation = {
  id: string
  email: string
  workspaceId: string
  status: "PENDING" | "ACCEPTED" | "EXPIRED"
  token: string
  expiresAt: string
  createdAt: string
  workspace?: { id: string; name: string }
  invitedBy?: { id: string; name: string }
}

export type WorkspaceDetail = Workspace & {
  members: WorkspaceMember[]
  invitations: WorkspaceInvitation[]
}

export type PaginatedWorkspaces = {
  items: Workspace[]
  total: number
  page: number
  pageSize: number
}

export async function getWorkspaces(page = 1, pageSize = 20): Promise<PaginatedWorkspaces> {
  const response = await fetch(`/api/workspaces?page=${page}&pageSize=${pageSize}`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch workspaces")
  }
  return response.json()
}

export async function createWorkspace(payload: { name: string }): Promise<Workspace> {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to create workspace")
  }
  return response.json()
}

export async function getWorkspace(id: string): Promise<WorkspaceDetail> {
  const response = await fetch(`/api/workspaces/${id}`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch workspace")
  }
  return response.json()
}

export async function updateWorkspace(
  id: string,
  payload: { name: string },
): Promise<Workspace> {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to update workspace")
  }
  return response.json()
}

export async function deleteWorkspace(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to delete workspace")
  }
  return response.json()
}

export async function removeMember(
  workspaceId: string,
  memberId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to remove member")
  }
  return response.json()
}

export async function getInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch invitations")
  }
  return response.json()
}

export async function inviteMember(
  workspaceId: string,
  payload: { email: string; workspaceName?: string },
): Promise<WorkspaceInvitation> {
  const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to send invitation")
  }
  return response.json()
}

export async function cancelInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to cancel invitation")
  }
  return response.json()
}

export async function resolveInvitation(token: string): Promise<WorkspaceInvitation> {
  const response = await fetch(`/api/invitations/${token}`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to resolve invitation")
  }
  return response.json()
}

export async function acceptInvitation(token: string): Promise<{ workspaceId: string }> {
  const response = await fetch(`/api/invitations/${token}`, {
    method: "POST",
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error((error as { message?: string }).message ?? "Failed to accept invitation")
  }
  return response.json()
}

export async function getPendingInvitations(): Promise<WorkspaceInvitation[]> {
  const response = await fetch("/api/invitations", {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch invitations")
  }
  return response.json()
}

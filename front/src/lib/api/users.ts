export type UserStatus = "ENABLED" | "DISABLED"

export type User = {
  id: string
  name: string
  email: string
  status: UserStatus
  admin: boolean
  createdAt: string
  updatedAt: string
}

type ListUsersResponse = {
  items: User[]
  total: number
  page: number
  pageSize: number
}

type CreateUserPayload = {
  name: string
  email: string
  status?: UserStatus
  admin?: boolean
}

type UpdateUserPayload = Partial<CreateUserPayload>

export async function listUsers(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: UserStatus
}): Promise<ListUsersResponse> {
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  if (params?.pageSize) query.set("pageSize", String(params.pageSize))
  if (params?.search) query.set("search", params.search)
  if (params?.status) query.set("status", params.status)

  const response = await fetch(`/api/users?${query.toString()}`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error("Failed to list users")
  }
  return response.json()
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("Failed to create user")
  }
  return response.json()
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error("Failed to update user")
  }
  return response.json()
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("Failed to delete user")
  }
}

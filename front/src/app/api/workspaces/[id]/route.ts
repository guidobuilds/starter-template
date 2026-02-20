import { auth } from "@/auth"
import { NextResponse } from "next/server"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

async function proxyRequest(path: string, options: { method: string; body?: string }) {
  const headers: HeadersInit = { "content-type": "application/json" }
  if (INTERNAL_API_KEY) headers["x-internal-api-key"] = INTERNAL_API_KEY
  return fetch(`${API_BASE}${path}`, { method: options.method, headers, body: options.body })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const { id } = await params
  const response = await proxyRequest(`/v1/workspaces/${id}`, { method: "GET" })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to fetch workspace" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership or admin
  const wsResponse = await proxyRequest(`/v1/workspaces/${id}`, { method: "GET" })
  if (!wsResponse.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to fetch workspace" },
      { status: wsResponse.status },
    )
  }
  const ws = (await wsResponse.json()) as { ownerId: string }
  if (ws.ownerId !== session.user.id && !session.user.admin) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Not authorized" }, { status: 403 })
  }

  const body = await request.text()
  const response = await proxyRequest(`/v1/workspaces/${id}`, { method: "PATCH", body })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to update workspace" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const { id } = await params

  const wsResponse = await proxyRequest(`/v1/workspaces/${id}`, { method: "GET" })
  if (!wsResponse.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Workspace not found" },
      { status: wsResponse.status },
    )
  }
  const ws = (await wsResponse.json()) as { ownerId: string }
  if (ws.ownerId !== session.user.id && !session.user.admin) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Not authorized" }, { status: 403 })
  }

  const response = await proxyRequest(`/v1/workspaces/${id}`, { method: "DELETE" })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to delete workspace" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

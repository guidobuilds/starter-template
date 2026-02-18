import { auth } from "@/auth"
import { NextResponse } from "next/server"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

async function proxyRequest(
  path: string,
  options: {
    method: string
    body?: string
  },
) {
  const headers: HeadersInit = {
    "content-type": "application/json",
  }

  if (INTERNAL_API_KEY) {
    headers["x-internal-api-key"] = INTERNAL_API_KEY
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method,
    headers,
    body: options.body,
  })

  return response
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Admin access required" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.text()
  const response = await proxyRequest(`/v1/users/${id}`, { method: "PATCH", body })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to update user" },
      { status: response.status },
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Admin access required" }, { status: 403 })
  }

  const { id } = await params
  const response = await proxyRequest(`/v1/users/${id}`, { method: "DELETE" })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to delete user" },
      { status: response.status },
    )
  }

  return new NextResponse(null, { status: 204 })
}

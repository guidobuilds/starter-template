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
  { params }: { params: Promise<{ token: string }> },
) {
  // Public — no auth check
  const { token } = await params
  const response = await proxyRequest(`/v1/workspaces/invitations/${token}`, { method: "GET" })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to resolve invitation" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const { token } = await params
  const response = await proxyRequest(`/v1/workspaces/invitations/${token}/accept`, {
    method: "POST",
    body: JSON.stringify({ userId: session.user.id }),
  })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to accept invitation" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

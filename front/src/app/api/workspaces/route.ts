import { auth } from "@/auth"
import { NextResponse } from "next/server"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

async function proxyRequest(path: string, options: { method: string; body?: string }) {
  const headers: HeadersInit = { "content-type": "application/json" }
  if (INTERNAL_API_KEY) headers["x-internal-api-key"] = INTERNAL_API_KEY
  return fetch(`${API_BASE}${path}`, { method: options.method, headers, body: options.body })
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const url = new URL(request.url)
  const page = url.searchParams.get("page") ?? "1"
  const pageSize = url.searchParams.get("pageSize") ?? "20"
  const userId = session.user.id

  const response = await proxyRequest(
    `/v1/workspaces?userId=${encodeURIComponent(userId)}&page=${page}&pageSize=${pageSize}`,
    { method: "GET" },
  )

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to fetch workspaces" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const payload = { ...body, ownerId: session.user.id }

  const response = await proxyRequest("/v1/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to create workspace" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json(), { status: 201 })
}

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

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const response = await proxyRequest(`/v1/users?${searchParams.toString()}`, { method: "GET" })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to fetch users" },
      { status: response.status },
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  if (!session.user.admin) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Admin access required" }, { status: 403 })
  }

  const body = await request.text()
  const response = await proxyRequest("/v1/users", { method: "POST", body })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to create user" },
      { status: response.status },
    )
  }

  const data = await response.json()
  return NextResponse.json(data, { status: 201 })
}

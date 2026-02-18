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

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const body = await request.text()
  const response = await proxyRequest(`/v1/profile/${session.user.id}/password`, { method: "PATCH", body })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    return NextResponse.json(
      errorData,
      { status: response.status },
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}

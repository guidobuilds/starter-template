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

export async function GET() {
  const session = await auth()
  if (session?.user) {
    return NextResponse.json(
      { authenticated: true },
      { status: 200 }
    )
  }

  const response = await proxyRequest("/v1/settings/auth/config", { method: "GET" })

  if (!response.ok) {
    return NextResponse.json(
      { basicAuthEnabled: true, googleAuthEnabled: false, googleConfigured: false },
      { status: 200 },
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}

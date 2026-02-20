import { auth } from "@/auth"
import { NextResponse } from "next/server"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

async function proxyRequest(path: string, options: { method: string; body?: string }) {
  const headers: HeadersInit = { "content-type": "application/json" }
  if (INTERNAL_API_KEY) headers["x-internal-api-key"] = INTERNAL_API_KEY
  return fetch(`${API_BASE}${path}`, { method: options.method, headers, body: options.body })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const { id, memberId } = await params
  const actorId = session.user.id

  const response = await proxyRequest(
    `/v1/workspaces/${id}/members/${memberId}?actorId=${encodeURIComponent(actorId)}`,
    { method: "DELETE" },
  )

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to remove member" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

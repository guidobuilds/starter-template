import { auth } from "@/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

const switchSchema = z.object({ workspaceId: z.string().min(1) })

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Not authenticated" },
      { status: 401 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = switchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "workspaceId is required" },
      { status: 400 },
    )
  }

  const { workspaceId } = parsed.data

  // Verify the user is actually a member of this workspace
  const headers: HeadersInit = { "content-type": "application/json" }
  if (INTERNAL_API_KEY) headers["x-internal-api-key"] = INTERNAL_API_KEY
  const wsResponse = await fetch(`${API_BASE}/v1/workspaces/${workspaceId}`, {
    headers,
  })

  if (!wsResponse.ok) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Workspace not found" },
      { status: 404 },
    )
  }

  const ws = (await wsResponse.json()) as { members?: { userId: string }[] }
  const isMember = ws.members?.some((m) => m.userId === session.user?.id)
  if (!isMember) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Not a member of this workspace" },
      { status: 403 },
    )
  }

  const cookieStore = await cookies()
  cookieStore.set("workspace:active", workspaceId, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  return NextResponse.json({ success: true })
}

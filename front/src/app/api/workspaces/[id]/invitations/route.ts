import { auth } from "@/auth"
import { sendWorkspaceInvitation } from "@/lib/email"
import { NextResponse } from "next/server"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

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
  const response = await proxyRequest(`/v1/workspaces/${id}/invitations`, { method: "GET" })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to fetch invitations" },
      { status: response.status },
    )
  }

  return NextResponse.json(await response.json())
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { email, workspaceName } = body as { email?: string; workspaceName?: string }

  const payload = {
    email,
    invitedById: session.user.id,
    inviterName: session.user.name ?? "Someone",
    workspaceName: workspaceName ?? "a workspace",
  }

  const response = await proxyRequest(`/v1/workspaces/${id}/invitations`, {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    return NextResponse.json(
      { code: "PROXY_ERROR", message: "Failed to create invitation" },
      { status: response.status },
    )
  }

  const invitation = (await response.json()) as { token: string }

  if (email) {
    const acceptUrl = `${APP_URL}/invitations/${invitation.token}`
    await sendWorkspaceInvitation({
      to: email,
      inviterName: session.user.name ?? "Someone",
      workspaceName: workspaceName ?? "a workspace",
      acceptUrl,
    }).catch(() => {
      // Email failure is non-fatal
    })
  }

  return NextResponse.json(invitation, { status: 201 })
}

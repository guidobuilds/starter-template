import { auth } from "@/auth"
import { AcceptInvitationClient } from "./AcceptInvitationClient"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

async function resolveInvitationServer(token: string) {
  const headers: HeadersInit = { "content-type": "application/json" }
  if (INTERNAL_API_KEY) headers["x-internal-api-key"] = INTERNAL_API_KEY

  const response = await fetch(`${API_BASE}/v1/workspaces/invitations/${token}`, {
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const status = response.status
    return { error: status === 410 ? "expired" : "not_found" } as const
  }

  const data = (await response.json()) as {
    workspace: { id: string; name: string }
    invitedBy: { id: string; name: string }
    email: string
  }
  return { data }
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth()
  const result = await resolveInvitationServer(token)

  if ("error" in result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-100 via-white to-slate-100 px-4 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Invitation not available
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {result.error === "expired"
              ? "This invitation has expired or has already been used."
              : "This invitation link is invalid."}
          </p>
        </div>
      </div>
    )
  }

  const { workspace, invitedBy } = result.data

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-100 via-white to-slate-100 px-4 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          You&apos;re invited to join <strong>{workspace.name}</strong>
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Invited by <strong>{invitedBy.name}</strong>
        </p>

        <div className="mt-6">
          <AcceptInvitationClient
            token={token}
            isLoggedIn={!!session?.user}
          />
        </div>
      </div>
    </div>
  )
}

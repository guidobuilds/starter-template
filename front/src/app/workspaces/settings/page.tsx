import { auth } from "@/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { WorkspaceSettingsClient } from "./WorkspaceSettingsClient"

export default async function WorkspaceSettingsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const cookieStore = await cookies()
  const activeWorkspaceId = cookieStore.get("workspace:active")?.value

  if (!activeWorkspaceId) {
    // No workspace selected yet — the WorkspaceSwitcher will set the cookie on first load.
    // Show a loading state until the client-side switcher sets the active workspace.
    return (
      <div className="p-4 sm:p-6">
        <div className="text-sm text-gray-500">Loading workspace...</div>
      </div>
    )
  }

  return (
    <WorkspaceSettingsClient
      workspaceId={activeWorkspaceId}
      currentUserId={session.user.id ?? ""}
      isAdmin={session.user.admin ?? false}
    />
  )
}

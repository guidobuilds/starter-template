"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import {
  cancelInvitation,
  deleteWorkspace,
  getWorkspace,
  inviteMember,
  removeMember,
  updateWorkspace,
  type WorkspaceDetail,
} from "@/lib/api/workspaces"
import { useRouter } from "next/navigation"
import * as React from "react"

type WorkspaceSettingsClientProps = {
  workspaceId: string
  currentUserId: string
  isAdmin: boolean
}

export function WorkspaceSettingsClient({
  workspaceId,
  currentUserId,
  isAdmin,
}: WorkspaceSettingsClientProps) {
  const router = useRouter()
  const [workspace, setWorkspace] = React.useState<WorkspaceDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [newName, setNewName] = React.useState("")
  const [renaming, setRenaming] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviting, setInviting] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const ws = await getWorkspace(workspaceId)
      setWorkspace(ws)
      setNewName(ws.name)
    } catch {
      setError("Failed to load workspace")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  React.useEffect(() => {
    void load()
  }, [load])

  const isOwner = workspace?.ownerId === currentUserId || isAdmin

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setRenaming(true)
    setError(null)
    setSuccess(null)
    try {
      await updateWorkspace(workspaceId, { name: newName.trim() })
      setSuccess("Workspace name saved.")
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename workspace")
    } finally {
      setRenaming(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setError(null)
    try {
      await removeMember(workspaceId, memberId)
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError(null)
    setSuccess(null)
    try {
      await inviteMember(workspaceId, {
        email: inviteEmail.trim(),
        workspaceName: workspace?.name,
      })
      setInviteEmail("")
      setSuccess("Invitation sent.")
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setInviting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setError(null)
    try {
      await cancelInvitation(workspaceId, invitationId)
      void load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invitation")
    }
  }

  const handleDelete = async () => {
    if (!workspace || workspace.isDefault) return
    setError(null)
    try {
      await deleteWorkspace(workspaceId)
      // Switch to default workspace
      await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId: "default" }),
      })
      router.refresh()
      router.push("/workspaces/settings")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace")
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-rose-600 dark:text-rose-400">
          {error ?? "Workspace not found"}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Workspace Settings
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage <span className="font-medium">{workspace.name}</span>
          {workspace.isDefault && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Default
            </span>
          )}
        </p>
      </div>

      {error && (
        <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}
      {success && (
        <p className="mt-4 text-sm text-green-600 dark:text-green-400">{success}</p>
      )}

      {/* General */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">General</h2>
        <form onSubmit={handleRename} className="mt-3 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
            disabled={!isOwner}
          />
          {isOwner && (
            <Button type="submit" disabled={renaming || !newName.trim()}>
              {renaming ? "Saving..." : "Save"}
            </Button>
          )}
        </form>
      </div>

      {/* Members */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Members</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                  Joined
                </th>
                {isOwner && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {workspace.members.map((member) => (
                <tr key={member.id} className="bg-white dark:bg-gray-950">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {member.user?.name ?? member.userId}
                    {member.userId === workspace.ownerId && (
                      <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        Owner
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {member.user?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right">
                      {member.userId !== workspace.ownerId && (
                        <Button
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite */}
      {isOwner && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Invite member
          </h2>
          <form onSubmit={handleInvite} className="mt-3 flex gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1"
            />
            <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Sending..." : "Send invitation"}
            </Button>
          </form>
        </div>
      )}

      {/* Pending invitations */}
      {isOwner && workspace.invitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Pending invitations
          </h2>
          <div className="mt-3 space-y-2">
            {workspace.invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
              >
                <div>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{inv.email}</span>
                  <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="ghost" onClick={() => handleCancelInvitation(inv.id)}>
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      {isOwner && !workspace.isDefault && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-rose-600 dark:text-rose-400">
            Danger zone
          </h2>
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Delete this workspace
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
              <Button variant="secondary" onClick={handleDelete}>
                Delete workspace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

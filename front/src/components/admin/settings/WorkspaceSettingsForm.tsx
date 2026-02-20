"use client"

import { Button } from "@/components/Button"
import { getSettings, updateWorkspaceSettings } from "@/lib/api/settings"
import React from "react"

export function WorkspaceSettingsForm() {
  const [workspacesEnabled, setWorkspacesEnabled] = React.useState(true)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        setWorkspacesEnabled(settings.workspacesEnabled ?? true)
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load settings")
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      await updateWorkspaceSettings({ workspacesEnabled })
      setSuccess(true)
    } catch {
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={workspacesEnabled}
            onChange={(e) => setWorkspacesEnabled(e.target.checked)}
            className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Enable Workspaces feature
        </label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          When enabled, users can create and manage workspaces and invite collaborators. When
          disabled, existing workspaces remain but new ones cannot be created.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {success && <p className="mt-4 text-sm text-green-600 dark:text-green-400">Settings saved.</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  )
}

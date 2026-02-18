"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { getSettings, updateGeneralSettings } from "@/lib/api/settings"
import React from "react"

export function GeneralSettingsForm() {
  const [instanceName, setInstanceName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        setInstanceName(settings.instanceName ?? "")
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
      await updateGeneralSettings({ instanceName: instanceName.trim() || undefined })
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
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Instance settings</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Configure the application name displayed to users.
      </p>

      <div className="mt-6 space-y-4">
        <div className="max-w-md">
          <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Instance name
          </label>
          <Input
            id="instanceName"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="My Application"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This name appears in the sidebar header and page title.
          </p>
        </div>
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

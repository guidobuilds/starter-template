"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { getSettings, updateGoogleAuthSettings } from "@/lib/api/settings"
import React from "react"

export function GoogleAuthSettingsForm() {
  const [googleClientId, setGoogleClientId] = React.useState("")
  const [googleClientSecret, setGoogleClientSecret] = React.useState("")
  const [hasSecret, setHasSecret] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        setGoogleClientId(settings.googleClientId ?? "")
        setHasSecret(!!settings.googleClientSecret)
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
      await updateGoogleAuthSettings({
        googleClientId: googleClientId.trim() || null,
        googleClientSecret: googleClientSecret.trim() || null,
      })
      setHasSecret(!!googleClientSecret.trim())
      setGoogleClientSecret("")
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
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Google OAuth</h4>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Configure Google OAuth for single sign-on. These values are stored in the database but not used at runtime (environment variables take precedence).
      </p>

      <div className="mt-4 space-y-4">
        <div className="max-w-md">
          <label htmlFor="googleClientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Google Client ID
          </label>
          <Input
            id="googleClientId"
            type="text"
            value={googleClientId}
            onChange={(e) => setGoogleClientId(e.target.value)}
            placeholder="your-client-id.apps.googleusercontent.com"
            className="mt-1"
          />
        </div>

        <div className="max-w-md">
          <label htmlFor="googleClientSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Google Client Secret
          </label>
          <Input
            id="googleClientSecret"
            type="password"
            value={googleClientSecret}
            onChange={(e) => setGoogleClientSecret(e.target.value)}
            placeholder={hasSecret ? "••••••••••••••••" : "Enter your client secret"}
            className="mt-1"
          />
          {hasSecret && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              A secret is already stored. Enter a new value to update it.
            </p>
          )}
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

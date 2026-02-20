"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { getSettings, updateGoogleAuthSettings } from "@/lib/api/settings"
import React from "react"

export function GoogleAuthSettingsForm() {
  const [googleAuthEnabled, setGoogleAuthEnabled] = React.useState(false)
  const [googleClientId, setGoogleClientId] = React.useState("")
  const [googleClientSecret, setGoogleClientSecret] = React.useState("")
  const [isConfigured, setIsConfigured] = React.useState(false)
  const [editMode, setEditMode] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        setGoogleAuthEnabled(settings.googleAuthEnabled ?? false)
        setIsConfigured(settings.googleConfigured ?? false)
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
      const payload: {
        googleAuthEnabled?: boolean
        googleClientId?: string | null
        googleClientSecret?: string | null
      } = { googleAuthEnabled }

      if (editMode || !isConfigured) {
        payload.googleClientId = googleClientId.trim() || null
        payload.googleClientSecret = googleClientSecret.trim() || null
      }

      await updateGoogleAuthSettings(payload)

      if (payload.googleClientId && payload.googleClientSecret) {
        setIsConfigured(true)
        setEditMode(false)
        setGoogleClientSecret("")
      } else if (!payload.googleClientId && !payload.googleClientSecret && editMode) {
        setIsConfigured(false)
        setEditMode(false)
      }

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

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const allowUrl = baseUrl
  const redirectUrl = `${baseUrl}/api/auth/callback/google`

  return (
    <form onSubmit={handleSubmit}>
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Google OAuth</h4>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Configure Google OAuth for single sign-on.
      </p>

      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={googleAuthEnabled}
              onChange={(e) => setGoogleAuthEnabled(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Enable Google authentication
          </label>
        </div>

        {googleAuthEnabled && (
          <>
            {isConfigured && !editMode ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Google OAuth is configured
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Credentials are securely stored. Click &quot;Change&quot; to update them.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditMode(true)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                    placeholder={isConfigured ? "••••••••••••••••" : "Enter your client secret"}
                    className="mt-1"
                  />
                  {isConfigured && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter a new secret to update, or leave blank to keep the existing one.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Google Cloud Console Configuration
              </h5>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                Make sure these URLs are configured in your Google Cloud Console:
              </p>
              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Authorized JavaScript origins:</span>
                  <code className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                    {allowUrl}
                  </code>
                </div>
                <div>
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Authorized redirect URI:</span>
                  <code className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800 break-all dark:bg-blue-800 dark:text-blue-200">
                    {redirectUrl}
                  </code>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {success && <p className="mt-4 text-sm text-green-600 dark:text-green-400">Settings saved.</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
        {editMode && isConfigured && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setEditMode(false)
              setGoogleClientId("")
              setGoogleClientSecret("")
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

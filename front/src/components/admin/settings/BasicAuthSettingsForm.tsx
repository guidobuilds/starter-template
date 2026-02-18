"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { getSettings, updateBasicAuthSettings } from "@/lib/api/settings"
import React from "react"

export function BasicAuthSettingsForm() {
  const [passwordMinLength, setPasswordMinLength] = React.useState(8)
  const [requireSpecial, setRequireSpecial] = React.useState(false)
  const [requireNumber, setRequireNumber] = React.useState(false)
  const [requireUppercase, setRequireUppercase] = React.useState(false)
  const [requireLowercase, setRequireLowercase] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    getSettings()
      .then((settings) => {
        setPasswordMinLength(settings.passwordMinLength)
        setRequireSpecial(settings.requireSpecial)
        setRequireNumber(settings.requireNumber)
        setRequireUppercase(settings.requireUppercase)
        setRequireLowercase(settings.requireLowercase)
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
      await updateBasicAuthSettings({
        passwordMinLength,
        requireSpecial,
        requireNumber,
        requireUppercase,
        requireLowercase,
      })
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
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Password requirements</h4>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        These rules apply when users register or change their password.
      </p>

      <div className="mt-4 space-y-4">
        <div className="max-w-xs">
          <label htmlFor="passwordMinLength" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Minimum password length
          </label>
          <Input
            id="passwordMinLength"
            type="number"
            min={6}
            max={128}
            value={passwordMinLength}
            onChange={(e) => setPasswordMinLength(parseInt(e.target.value, 10) || 8)}
            className="mt-1"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={requireSpecial}
              onChange={(e) => setRequireSpecial(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Require special characters
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={requireNumber}
              onChange={(e) => setRequireNumber(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Require numbers
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={requireUppercase}
              onChange={(e) => setRequireUppercase(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Require uppercase letters
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={requireLowercase}
              onChange={(e) => setRequireLowercase(e.target.checked)}
              className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Require lowercase letters
          </label>
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

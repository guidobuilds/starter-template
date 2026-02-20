"use client"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { Input } from "@/components/Input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs"
import { getProfile, updateProfile, updatePassword } from "@/lib/api/profile"
import React from "react"

type AuthMethod = "BASIC" | "GOOGLE"

export default function ProfilePage() {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [savingPassword, setSavingPassword] = React.useState(false)
  const [profileError, setProfileError] = React.useState<string | null>(null)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = React.useState(false)
  const [passwordSuccess, setPasswordSuccess] = React.useState(false)
  const [authMethod, setAuthMethod] = React.useState<AuthMethod>("BASIC")

  const isGoogleUser = authMethod === "GOOGLE"

  React.useEffect(() => {
    getProfile()
      .then((profile) => {
        setName(profile.name)
        setEmail(profile.email)
        setAuthMethod((profile as { authMethod?: AuthMethod }).authMethod ?? "BASIC")
        setLoading(false)
      })
      .catch(() => {
        setProfileError("Failed to load profile")
        setLoading(false)
      })
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setSavingProfile(true)

    try {
      await updateProfile({
        name: name.trim() || undefined,
      })
      setProfileSuccess(true)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    setSavingPassword(true)

    try {
      await updatePassword({
        currentPassword,
        newPassword,
      })
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">
        Profile
      </h1>
      <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-500">
        Manage your personal details and account settings.
      </p>

      <Tabs defaultValue="account" className="mt-8">
        <TabsList variant="line">
          <TabsTrigger value="account" variant="line">
            Account details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="mt-8 space-y-8">
            <form onSubmit={handleProfileSubmit}>
              <h2 className="font-semibold text-gray-900 dark:text-gray-50">
                Email
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                Email address cannot be changed.
              </p>
              <div className="mt-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  disabled
                  className="mt-2 w-full sm:max-w-lg cursor-not-allowed opacity-60"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display name
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isGoogleUser}
                  className={`mt-2 w-full sm:max-w-lg ${isGoogleUser ? "cursor-not-allowed opacity-60" : ""}`}
                />
                {isGoogleUser && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Google users cannot change their display name.
                  </p>
                )}
              </div>
              {profileError && (
                <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{profileError}</p>
              )}
              {profileSuccess && (
                <p className="mt-4 text-sm text-green-600 dark:text-green-400">Profile updated.</p>
              )}
              {!isGoogleUser && (
                <Button type="submit" className="mt-6" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Update profile"}
                </Button>
              )}
            </form>

            <Divider />

            {isGoogleUser ? (
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-50">
                  Password
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                  Google users authenticate via Google and do not have a password set.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                <h2 className="font-semibold text-gray-900 dark:text-gray-50">
                  Password
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                  Update your password associated with this account.
                </p>
                <div className="mt-6">
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current password
                  </label>
                  <Input
                    type="password"
                    id="current-password"
                    name="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="mt-2 w-full sm:max-w-lg"
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New password
                  </label>
                  <Input
                    type="password"
                    id="new-password"
                    name="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-2 w-full sm:max-w-lg"
                  />
                </div>
                {passwordError && (
                  <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="mt-4 text-sm text-green-600 dark:text-green-400">Password updated.</p>
                )}
                <Button type="submit" className="mt-6" disabled={savingPassword}>
                  {savingPassword ? "Updating..." : "Update password"}
                </Button>
              </form>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

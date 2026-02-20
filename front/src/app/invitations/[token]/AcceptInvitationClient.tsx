"use client"

import { Button } from "@/components/Button"
import { acceptInvitation } from "@/lib/api/workspaces"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"

type Props = {
  token: string
  isLoggedIn: boolean
}

export function AcceptInvitationClient({ token, isLoggedIn }: Props) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleAccept = async () => {
    setLoading(true)
    setError(null)
    try {
      await acceptInvitation(token)
      router.push("/workspaces")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation")
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sign in to accept this invitation.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/invitations/${token}`)}`}
          className="block w-full rounded-md bg-blue-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-600"
        >
          Sign in to accept
        </Link>
        <Link
          href={`/signup?callbackUrl=${encodeURIComponent(`/invitations/${token}`)}`}
          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          Create account
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <Button className="w-full" onClick={handleAccept} disabled={loading}>
        {loading ? "Accepting..." : "Accept invitation"}
      </Button>
    </div>
  )
}

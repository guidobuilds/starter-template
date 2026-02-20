"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { RiGoogleFill } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { FormEvent, useState, useEffect } from "react"
import { signIn } from "next-auth/react"

type AuthConfig = {
  basicAuthEnabled: boolean
  googleAuthEnabled: boolean
}

export function AuthCard() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null)

  useEffect(() => {
    fetch("/api/auth/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.push("/")
          return
        }
        setAuthConfig(data)
      })
      .catch(() => {
        setAuthConfig({ basicAuthEnabled: true, googleAuthEnabled: false })
      })
  }, [router])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials or disabled account")
        setIsLoading(false)
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Unexpected error. Please try again")
      setIsLoading(false)
    }
  }

  if (!authConfig) {
    return (
      <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Access your B2B workspace and admin tools.
      </p>

      {authConfig.basicAuthEnabled && (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (8+ chars)"
            required
          />

          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : null}

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : "Sign in with email"}
          </Button>
        </form>
      )}

      {authConfig.googleAuthEnabled && authConfig.basicAuthEnabled && (
        <div className="my-5 h-px w-full bg-gray-200 dark:bg-gray-800" />
      )}

      {authConfig.googleAuthEnabled && (
        <Button
          variant="secondary"
          className="w-full gap-2"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <RiGoogleFill className="size-4" />
          Continue with Google
        </Button>
      )}

      {authConfig.basicAuthEnabled && (
        <button
          type="button"
          className="mt-5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          onClick={() => router.push("/signup")}
        >
          No account yet? Sign up
        </button>
      )}
    </div>
  )
}

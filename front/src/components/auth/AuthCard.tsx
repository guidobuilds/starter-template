"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { RiGoogleFill } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { signIn } from "next-auth/react"

type Mode = "signin" | "register"

export function AuthCard() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === "register") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { message?: string }
            | null
          setError(body?.message ?? "Unable to register")
          setIsLoading(false)
          return
        }
      }

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

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Access your B2B workspace and admin tools.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        {mode === "register" ? (
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            required
          />
        ) : null}
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
          {isLoading
            ? "Please wait..."
            : mode === "signin"
              ? "Sign in with email"
              : "Register with email"}
        </Button>
      </form>

      <div className="my-5 h-px w-full bg-gray-200 dark:bg-gray-800" />

      <Button
        variant="secondary"
        className="w-full gap-2"
        onClick={() => signIn("google", { callbackUrl: "/login" })}
      >
        <RiGoogleFill className="size-4" />
        Continue with Google
      </Button>

      <button
        className="mt-5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        onClick={() => setMode(mode === "signin" ? "register" : "signin")}
      >
        {mode === "signin"
          ? "No account yet? Register"
          : "Already have an account? Sign in"}
      </button>
    </div>
  )
}

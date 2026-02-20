import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SignupCard } from "@/components/auth/SignupCard"

export default async function SignupPage() {
  const session = await auth()
  if (session?.user) {
    redirect(session.user.admin ? "/admin/users" : "/quotes/overview")
  }

  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: {
      basicAuthEnabled: true,
      googleAuthEnabled: true,
      googleClientIdEncrypted: true,
      googleClientId: true,
    },
  })

  if (!settings?.basicAuthEnabled) {
    redirect("/login")
  }

  const googleConfigured = !!(
    settings.googleClientIdEncrypted ||
    settings.googleClientId
  )
  const googleAuthEnabled = settings.googleAuthEnabled && googleConfigured

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-white to-slate-100 px-4 py-12 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
            B2B Starter Template
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl dark:text-gray-100">
            Create your account
          </h1>
        </div>
        <SignupCard googleAuthEnabled={googleAuthEnabled} />
      </div>
    </div>
  )
}

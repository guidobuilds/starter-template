import { SidebarProvider, SidebarTrigger } from "@/components/Sidebar"
import { AppSidebar } from "@/components/ui/navigation/AppSidebar"
import { Breadcrumbs } from "@/components/ui/navigation/Breadcrumbs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

async function getInstanceName(): Promise<string | null> {
  try {
    const headers: HeadersInit = {}
    if (INTERNAL_API_KEY) {
      headers["x-internal-api-key"] = INTERNAL_API_KEY
    }
    const response = await fetch(`${API_BASE}/v1/settings`, {
      headers,
      cache: "no-store",
    })
    if (response.ok) {
      const data = (await response.json()) as { instanceName?: string | null }
      return data.instanceName ?? null
    }
  } catch {
    // ignore
  }
  return null
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/")
  }

  if (!session.user.admin) {
    redirect("/quotes/overview")
  }

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"
  const instanceName = await getInstanceName()

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        instanceName={instanceName}
        isAdmin={true}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="w-full">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
          <SidebarTrigger className="-ml-1" />
          <div className="mr-2 h-4 w-px bg-gray-200 dark:bg-gray-800" />
          <Breadcrumbs />
        </header>
        <main>{children}</main>
      </div>
    </SidebarProvider>
  )
}

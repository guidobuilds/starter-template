"use client"

import { ConfirmDialog } from "@/components/ConfirmDialog"
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "@/components/admin/settings/UnsavedChangesContext"
import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React from "react"

const tabs = [
  { name: "General", href: "/admin/settings/general" },
  { name: "Authentication", href: "/admin/settings/auth" },
  { name: "Workspaces", href: "/admin/settings/workspaces" },
]

export function SettingsLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <UnsavedChangesProvider>
      <SettingsLayoutClientInner>{children}</SettingsLayoutClientInner>
    </UnsavedChangesProvider>
  )
}

function SettingsLayoutClientInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasUnsavedChanges, clearAllUnsavedChanges } = useUnsavedChanges()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)

  const isTabActive = (href: string) => {
    if (href === "/admin/settings/auth") {
      return pathname.startsWith("/admin/settings/auth")
    }
    return pathname === href
  }

  const handleTabClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (isTabActive(href)) {
      return
    }
    if (!hasUnsavedChanges) {
      return
    }
    event.preventDefault()
    setPendingHref(href)
    setConfirmOpen(true)
  }

  const handleConfirmLeave = () => {
    if (!pendingHref) {
      return
    }
    clearAllUnsavedChanges()
    router.push(pendingHref)
    setPendingHref(null)
    setConfirmOpen(false)
  }

  return (
    <div className="p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7">
      <h1 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">Settings</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Manage application configuration and authentication settings.
      </p>
      <TabNavigation className="mt-4 gap-x-4 sm:mt-6 lg:mt-10">
        {tabs.map((tab) => (
          <TabNavigationLink key={tab.name} asChild active={isTabActive(tab.href)}>
            <Link href={tab.href} onClick={(event) => handleTabClick(event, tab.href)}>
              {tab.name}
            </Link>
          </TabNavigationLink>
        ))}
      </TabNavigation>
      <div className="pt-6">{children}</div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="You have unsaved changes"
        description="Discard unsaved changes and leave this page?"
        confirmLabel="Discard changes"
        cancelLabel="Stay"
        variant="destructive"
        onConfirm={handleConfirmLeave}
        onCancel={() => {
          setPendingHref(null)
        }}
      />
    </div>
  )
}

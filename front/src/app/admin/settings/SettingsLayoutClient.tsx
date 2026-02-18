"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

const tabs = [
  { name: "General", href: "/admin/settings/general" },
  { name: "Authentication", href: "/admin/settings/auth/basic" },
]

export function SettingsLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Manage application configuration and authentication settings.
      </p>
      <TabNavigation className="mt-6 gap-x-4">
        {tabs.map((tab) => (
          <TabNavigationLink
            key={tab.name}
            asChild
            active={pathname.startsWith(tab.href) || (tab.name === "Authentication" && pathname.startsWith("/admin/settings/auth"))}
          >
            <Link href={tab.href}>{tab.name}</Link>
          </TabNavigationLink>
        ))}
      </TabNavigation>
      <div className="mt-6">{children}</div>
    </div>
  )
}

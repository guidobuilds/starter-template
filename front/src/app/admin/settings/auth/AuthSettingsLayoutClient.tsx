"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

const tabs = [
  { name: "Basic", href: "/admin/settings/auth/basic" },
  { name: "Google", href: "/admin/settings/auth/google" },
]

export function AuthSettingsLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Authentication Settings</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Configure password policies and OAuth providers.
      </p>

      <TabNavigation className="mt-6 gap-x-4">
        {tabs.map((tab) => (
          <TabNavigationLink key={tab.name} asChild active={pathname === tab.href}>
            <Link href={tab.href}>{tab.name}</Link>
          </TabNavigationLink>
        ))}
      </TabNavigation>

      <div className="mt-6">{children}</div>
    </>
  )
}

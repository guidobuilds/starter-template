"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarLink,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSubLink,
} from "@/components/Sidebar"
import { cx, focusRing } from "@/lib/utils"
import { RiArrowDownSFill } from "@remixicon/react"
import { BarChart3, Home, Monitor, FileText, Settings, Shield, Users } from "lucide-react"
import { usePathname } from "next/navigation"
import * as React from "react"
import { Logo } from "../../../../public/Logo"
import { UserProfile } from "./UserProfile"

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: { name: string; href: string }[]
  adminOnly?: boolean
}

const navigation: NavItem[] = [
  {
    name: "Quotes",
    href: "/quotes/overview",
    icon: BarChart3,
    children: [
      { name: "Overview", href: "/quotes/overview" },
      { name: "Monitoring", href: "/quotes/monitoring" },
      { name: "Audits", href: "/quotes/audits" },
    ],
  },
  {
    name: "Admin",
    href: "/admin/users",
    icon: Shield,
    adminOnly: true,
    children: [{ name: "Users", href: "/admin/users" }],
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    adminOnly: true,
    children: [
      { name: "General", href: "/admin/settings/general" },
      { name: "Authentication", href: "/admin/settings/auth/basic" },
    ],
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  instanceName?: string | null
  isAdmin?: boolean
  userName?: string | null
  userEmail?: string | null
}

export function AppSidebar({ instanceName, isAdmin = false, userName, userEmail, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const [openMenus, setOpenMenus] = React.useState<string[]>(
    navigation.map((n) => n.name),
  )

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  const visibleNavigation = navigation.filter((item) => !item.adminOnly || isAdmin)

  const isItemActive = (item: NavItem) => {
    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
    }
    return pathname.startsWith(item.href + "/")
  }

  const isChildActive = (childHref: string) => {
    return pathname === childHref || pathname.startsWith(childHref + "/")
  }

  return (
    <Sidebar {...props} className="bg-gray-50 dark:bg-gray-925">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-white p-1.5 shadow-xs ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <Logo className="size-6 text-blue-500 dark:text-blue-500" />
          </span>
          <div>
            <span className="block text-sm font-semibold text-gray-900 dark:text-gray-50">
              {instanceName || "B2B Starter"}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {isAdmin ? "Admin" : "Dashboard"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={cx(
                          "flex w-full items-center justify-between gap-x-2.5 rounded-md p-2 text-base transition hover:bg-gray-200/50 sm:text-sm",
                          isItemActive(item)
                            ? "bg-gray-200/50 text-gray-900 dark:bg-gray-800/50 dark:text-gray-50"
                            : "text-gray-700 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-50",
                          focusRing,
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
                          {item.name}
                        </div>
                        <RiArrowDownSFill
                          className={cx(
                            openMenus.includes(item.name) ? "rotate-0" : "-rotate-90",
                            "size-5 shrink-0 transform text-gray-400 transition-transform duration-150 ease-in-out dark:text-gray-600",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {openMenus.includes(item.name) && (
                        <SidebarMenuSub>
                          <div className="absolute inset-y-0 left-4 w-px bg-gray-300 dark:bg-gray-800" />
                          {item.children.map((child) => (
                            <SidebarMenuItem key={child.name}>
                              <SidebarSubLink
                                href={child.href}
                                isActive={isChildActive(child.href)}
                              >
                                {child.name}
                              </SidebarSubLink>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    <SidebarLink
                      href={item.href}
                      isActive={isItemActive(item)}
                      icon={item.icon}
                    >
                      {item.name}
                    </SidebarLink>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="border-t border-gray-200 dark:border-gray-800" />
        <UserProfile name={userName} email={userEmail} />
      </SidebarFooter>
    </Sidebar>
  )
}

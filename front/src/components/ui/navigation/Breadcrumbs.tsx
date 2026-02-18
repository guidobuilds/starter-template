"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Breadcrumbs() {
  const pathname = usePathname()
  const last = pathname.split("/").filter(Boolean).at(-1) ?? "home"

  return (
    <>
      <nav aria-label="Breadcrumb" className="ml-2">
        <ol role="list" className="flex items-center space-x-3 text-sm">
          <li className="flex">
            <Link
              href="/"
              className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Home
            </Link>
          </li>
          <ChevronRight
            className="size-4 shrink-0 text-gray-600 dark:text-gray-400"
            aria-hidden="true"
          />
          <li className="flex">
            <div className="flex items-center">
              <Link
                href={pathname}
                className="text-gray-900 dark:text-gray-50"
              >
                {last.charAt(0).toUpperCase() + last.slice(1)}
              </Link>
            </div>
          </li>
        </ol>
      </nav>
    </>
  )
}

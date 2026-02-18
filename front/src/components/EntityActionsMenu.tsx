"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { RiMore2Fill } from "@remixicon/react"
import * as React from "react"

type ActionItem = {
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

type Props = {
  actions: ActionItem[]
  "aria-label"?: string
}

export function EntityActionsMenu({ actions, "aria-label": ariaLabel }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        aria-label={ariaLabel ?? "Open actions menu"}
      >
        <RiMore2Fill className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <React.Fragment key={`${action.label}-${index}`}>
            {action.variant === "destructive" && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={
                action.variant === "destructive"
                  ? "text-red-600 dark:text-red-400 focus-visible:bg-red-50 dark:focus-visible:bg-red-950"
                  : undefined
              }
            >
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

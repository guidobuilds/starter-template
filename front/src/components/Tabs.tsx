"use client"

import * as TabsPrimitives from "@radix-ui/react-tabs"
import React from "react"
import { cx, focusRing } from "@/lib/utils"

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Root>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitives.Root
    ref={forwardedRef}
    className={cx("w-full", className)}
    {...props}
  />
))
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.List> & {
    variant?: "line" | "solid"
  }
>(({ className, variant = "solid", ...props }, forwardedRef) => (
  <TabsPrimitives.List
    ref={forwardedRef}
    className={cx(
      "inline-flex items-center",
      variant === "line"
        ? "border-b border-gray-200 dark:border-gray-800"
        : "gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800",
      className,
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Trigger> & {
    variant?: "line" | "solid"
  }
>(({ className, variant = "solid", ...props }, forwardedRef) => (
  <TabsPrimitives.Trigger
    ref={forwardedRef}
    className={cx(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      variant === "line"
        ? "-mb-px border-b-2 border-transparent text-gray-500 hover:text-gray-700 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:text-gray-400 dark:hover:text-gray-300 dark:data-[state=active]:border-blue-500 dark:data-[state=active]:text-blue-500"
        : "rounded-md text-gray-600 hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow dark:text-gray-400 dark:hover:text-gray-100 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-50",
      focusRing,
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitives.Content>
>(({ className, ...props }, forwardedRef) => (
  <TabsPrimitives.Content
    ref={forwardedRef}
    className={cx(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }

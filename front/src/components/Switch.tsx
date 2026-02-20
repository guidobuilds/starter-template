"use client"

import * as SwitchPrimitives from "@radix-ui/react-switch"
import * as React from "react"

import { cx, focusRing } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, forwardedRef) => (
  <SwitchPrimitives.Root
    className={cx(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 shadow-sm transition-colors",
      "ring-1 ring-inset ring-gray-300 dark:ring-gray-800",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200",
      "dark:data-[state=checked]:bg-blue-600 dark:data-[state=unchecked]:bg-gray-950",
      "dark:focus-visible:ring-offset-gray-950",
      focusRing,
      className,
    )}
    {...props}
    ref={forwardedRef}
    tremor-id="tremor-raw"
  >
    <SwitchPrimitives.Thumb
      className={cx(
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
        "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        "dark:bg-gray-50",
      )}
    />
  </SwitchPrimitives.Root>
))

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

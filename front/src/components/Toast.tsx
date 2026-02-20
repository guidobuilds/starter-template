"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { tv, type VariantProps } from "tailwind-variants"
import { RiCloseLine } from "@remixicon/react"

import { cx, focusRing } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, forwardedRef) => (
  <ToastPrimitives.Viewport
    ref={forwardedRef}
    className={cx(
      "fixed right-0 top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]",
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

const toastVariants = tv({
  base: "group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  variants: {
    variant: {
      default: "border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
      success: "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50",
      destructive: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, forwardedRef) => {
  return (
    <ToastPrimitives.Root
      ref={forwardedRef}
      className={cx(toastVariants({ variant }), className)}
      tremor-id="tremor-raw"
      {...props}
    />
  )
})
Toast.displayName = "Toast"

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, forwardedRef) => (
  <ToastPrimitives.Action
    ref={forwardedRef}
    className={cx(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors",
      "border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "dark:border-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-400 dark:focus:ring-offset-gray-900",
      focusRing,
      className,
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, forwardedRef) => (
  <ToastPrimitives.Close
    ref={forwardedRef}
    className={cx(
      "absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100",
      "text-gray-500 hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2",
      "dark:text-gray-400 dark:hover:text-gray-50",
      focusRing,
      className,
    )}
    toast-close=""
    {...props}
  >
    <RiCloseLine className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, forwardedRef) => (
  <ToastPrimitives.Title
    ref={forwardedRef}
    className={cx("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, forwardedRef) => (
  <ToastPrimitives.Description
    ref={forwardedRef}
    className={cx("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
}

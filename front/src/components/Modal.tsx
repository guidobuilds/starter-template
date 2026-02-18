"use client"

import * as DialogPrimitives from "@radix-ui/react-dialog"
import { RiCloseLine } from "@remixicon/react"
import * as React from "react"

import { cx, focusRing } from "@/lib/utils"

const Modal = (props: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Root>) => {
  return <DialogPrimitives.Root {...props} />
}
Modal.displayName = "Modal"

const ModalTrigger = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Trigger>
>(({ className, ...props }, ref) => {
  return <DialogPrimitives.Trigger ref={ref} className={cx(className)} {...props} />
})
ModalTrigger.displayName = "ModalTrigger"

const ModalClose = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Close>
>(({ className, ...props }, ref) => {
  return <DialogPrimitives.Close ref={ref} className={cx(className)} {...props} />
})
ModalClose.displayName = "ModalClose"

const ModalPortal = DialogPrimitives.Portal
ModalPortal.displayName = "ModalPortal"

const ModalOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitives.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Overlay>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DialogPrimitives.Overlay
      ref={forwardedRef}
      className={cx(
        "fixed inset-0 z-50 overflow-y-auto",
        "bg-black/30",
        "data-[state=open]:animate-dialogOverlayShow data-[state=closed]:animate-hide",
        className,
      )}
      {...props}
      style={{ animationDuration: "200ms", animationFillMode: "backwards" }}
    />
  )
})
ModalOverlay.displayName = "ModalOverlay"

const ModalContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content>
>(({ className, children, ...props }, forwardedRef) => {
  return (
    <ModalPortal>
      <ModalOverlay>
        <DialogPrimitives.Content
          ref={forwardedRef}
          className={cx(
            "fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-lg",
            "border-gray-200 dark:border-gray-800",
            "bg-white dark:bg-gray-950",
            "data-[state=closed]:animate-hide data-[state=open]:animate-dialogOverlayShow",
            focusRing,
            className,
          )}
          {...props}
        >
          {children}
        </DialogPrimitives.Content>
      </ModalOverlay>
    </ModalPortal>
  )
})
ModalContent.displayName = "ModalContent"

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className="flex items-start justify-between gap-x-4 pb-4"
      {...props}
    >
      <div className={cx("flex flex-col gap-y-1", className)}>{children}</div>
      <DialogPrimitives.Close
        className={cx(
          "rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
          "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
          focusRing,
        )}
      >
        <RiCloseLine className="size-5" aria-hidden="true" />
      </DialogPrimitives.Close>
    </div>
  )
})
ModalHeader.displayName = "ModalHeader"

const ModalTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Title>
>(({ className, ...props }, forwardedRef) => (
  <DialogPrimitives.Title
    ref={forwardedRef}
    className={cx("text-lg font-semibold text-gray-900 dark:text-gray-50", className)}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

const ModalDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Description>
>(({ className, ...props }, forwardedRef) => {
  return (
    <DialogPrimitives.Description
      ref={forwardedRef}
      className={cx("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  )
})
ModalDescription.displayName = "ModalDescription"

const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cx("py-4", className)} {...props} />
})
ModalBody.displayName = "ModalBody"

const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cx(
        "flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end dark:border-gray-800",
        className,
      )}
      {...props}
    />
  )
}
ModalFooter.displayName = "ModalFooter"

export {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
}

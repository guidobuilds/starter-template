import { Divider } from "@/components/Divider"
import { Skeleton } from "@/components/Skeleton"
import { cx } from "@/lib/utils"
import * as React from "react"

interface SettingsSectionProps {
  id: string
  title: string
  description: string
  children: React.ReactNode
  className?: string
  loading?: boolean
}

export function SettingsSection({
  id,
  title,
  description,
  children,
  className,
  loading = false,
}: SettingsSectionProps) {
  if (loading) {
    return (
      <section aria-labelledby={id} className={className}>
        <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
          <div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby={id} className={className}>
      <div className="grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3">
        <div>
          <h2
            id={id}
            className="scroll-mt-10 font-semibold text-gray-900 dark:text-gray-50"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
        </div>
        <div className="md:col-span-2">{children}</div>
      </div>
    </section>
  )
}

interface SettingsSectionDividerProps {
  show?: boolean
}

export function SettingsSectionDivider({ show = true }: SettingsSectionDividerProps) {
  if (!show) return null
  return <Divider />
}

interface SettingsFieldProps {
  label: string
  htmlFor: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingsField({
  label,
  htmlFor,
  description,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cx("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  )
}

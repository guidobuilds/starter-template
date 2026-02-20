import { cx } from "@/lib/utils"
import type { HTMLAttributes } from "react"

function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  )
}

export { Skeleton }

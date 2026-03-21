import * as React from "react"
import { cn } from "@/renderer/lib/utils"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-divider bg-surface px-3 py-2 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/12 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Select.displayName = "Select"

export { Select }

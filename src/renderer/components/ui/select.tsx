import * as React from "react"
import { cn } from "@/renderer/lib/utils"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:border-ring/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Select.displayName = "Select"

export { Select }

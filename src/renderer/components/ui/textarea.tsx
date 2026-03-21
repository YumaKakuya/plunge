import * as React from "react"
import { cn } from "@/renderer/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

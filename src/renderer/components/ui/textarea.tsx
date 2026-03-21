import * as React from "react"
import { cn } from "@/renderer/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-lg border border-divider bg-surface px-3 py-2 text-sm text-foreground transition-colors duration-150 placeholder:text-text-muted focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/12 disabled:cursor-not-allowed disabled:opacity-50 resize-none select-text",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

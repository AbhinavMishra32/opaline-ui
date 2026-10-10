import * as React from "react"

import { cn } from "../lib/utils"

/** A key, drawn the way a menu draws its shortcut: quiet, in the UI face, never a button. */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-[calc(var(--radius-sm)+1px)] bg-muted px-1 font-sans text-ui-sm font-medium text-muted-foreground select-none [&_svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="kbd-group" className={cn("inline-flex items-center gap-0.5", className)} {...props} />
}

export { Kbd, KbdGroup }

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@opaline/ui"

export default function CollapsibleDemo() {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible className="w-full max-w-sm" onOpenChange={setOpen} open={open}>
      <CollapsibleTrigger className="flex items-center gap-1.5 text-ui font-medium">
        <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        Three files changed
      </CollapsibleTrigger>
      <CollapsibleContent gap={8}>
        <ul className="grid gap-1 rounded-lg border bg-card p-2 font-mono text-ui-sm text-muted-foreground">
          <li>src/auth/session.ts</li>
          <li>src/auth/refresh.ts</li>
          <li>test/login.spec.ts</li>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

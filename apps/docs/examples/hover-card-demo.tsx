import { HoverCard, HoverCardContent, HoverCardTrigger } from "@opaline/ui"

export default function HoverCardDemo() {
  return (
    <p className="text-ui text-muted-foreground">
      The fix lives in{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a className="font-mono text-foreground underline decoration-border-strong underline-offset-4" href="#">
            session.ts
          </a>
        </HoverCardTrigger>
        <HoverCardContent className="w-72 p-3">
          <p className="font-mono text-ui-sm text-foreground">src/auth/session.ts</p>
          <p className="mt-1 text-ui-sm text-muted-foreground">
            Creates and refreshes sessions. Edited 2 minutes ago by the agent: +4 −1.
          </p>
        </HoverCardContent>
      </HoverCard>
      , in the refresh path.
    </p>
  )
}

import * as React from "react"
import { Sparkles } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@opaline/ui"
import { Composer, ComposerPill, Thread, ThreadMessages, ThreadViewport, type ThreadMessage } from "@opaline/ui/thread"

const greeting: ThreadMessage[] = [
  { id: "s1", role: "system", text: "Connected to acme/web" },
  { id: "a0", role: "assistant", status: "done", parts: [{ type: "text", id: "x0", text: "Hi! I can read this repo, run commands, and open PRs. What are we working on?" }] },
]

export default function ThreadCompound() {
  const [messages, setMessages] = React.useState(greeting)
  const [model, setModel] = React.useState("Opus 5.5")

  return (
    <Thread className="h-full">
      <ThreadViewport>
        <ThreadMessages messages={messages} />
      </ThreadViewport>
      <div className="shrink-0 px-4 pb-3">
        <Composer
          hint="Return to send"
          leading={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ComposerPill chevron icon={Sparkles}>
                  {model}
                </ComposerPill>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                {["Opus 5.5", "Sonnet 5", "Haiku 4.5"].map((name) => (
                  <DropdownMenuItem key={name} onSelect={() => setModel(name)}>
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          }
          onSubmit={(text) => setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }])}
        />
      </div>
    </Thread>
  )
}

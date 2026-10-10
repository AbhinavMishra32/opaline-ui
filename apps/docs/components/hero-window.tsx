"use client"

import * as React from "react"
import {
  ArrowUpRight,
  Check,
  ChevronsUpDown,
  Code2,
  Ellipsis,
  FileCode2,
  GitBranch,
  GitPullRequest,
  Globe,
  MessageSquare,
  PanelLeft,
  Paperclip,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share,
  ShieldCheck,
  Timer,
} from "lucide-react"
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Kbd,
  Meter,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ViewSwitch,
} from "@opaline/ui"
import { AgentThread, ComposerPill, ContextUsage, EffortPicker, ModelPicker, Orb, UsageRow, type ModelValue, type ThreadMessage } from "@opaline/ui/thread"
import { providers } from "@/lib/models"
import { demoScript } from "@/lib/demo-script"
import { usePlayback } from "@/lib/use-playback"

/**
 * The landing demo: a whole agent app built from Opaline, with the thread
 * streaming a scripted turn through the real reducer. Everything on it is a
 * library component; only the layout is the page's.
 */
export function HeroWindow({ className }: { className?: string }) {
  const { messages, playing, play, stop } = usePlayback()
  const runs = React.useRef(0)
  const [view, setView] = React.useState<"thread" | "changes">("thread")
  const [model, setModel] = React.useState<ModelValue>({ provider: "anthropic", model: "claude-opus-5-5" })
  const [effort, setEffort] = React.useState("high")
  const [fast, setFast] = React.useState(false)
  const [web, setWeb] = React.useState(false)
  const [autoAccept, setAutoAccept] = React.useState(true)

  const replay = React.useCallback(() => {
    setView("thread")
    play(demoScript(`run-${++runs.current}`), { reset: true })
  }, [play])
  React.useEffect(replay, [replay])

  const edited = hasEdit(messages)
  const reasons = providers.find((p) => p.id === model.provider)?.models.find((m) => m.id === model.model)?.reasoning ?? false

  return (
    <TooltipProvider>
      <div
        className={cn(
          "op-sheet relative flex h-[min(720px,82vh)] w-full bg-sidebar text-left shadow-[0_30px_80px_-20px_oklch(0%_0_0/22%),0_10px_30px_-10px_oklch(0%_0_0/10%)]",
          className,
        )}
      >
        <Sidebar playing={playing} />

        <main className="op-pane m-1.5 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[calc(var(--radius-2xl)-0.375rem)] bg-background md:ml-0">
          <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border/60 px-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <p className="truncate text-ui font-medium">Flaky login test</p>
              <span className="hidden items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground lg:inline-flex">
                <GitBranch className="size-3" /> fix/login-race
              </span>
            </div>
            <ViewSwitch
              ariaLabel="Panel"
              className="hidden w-60 sm:grid"
              onChange={setView}
              options={[
                { value: "thread", label: "Thread", icon: MessageSquare },
                {
                  value: "changes",
                  label: "Changes",
                  icon: Code2,
                  badge: edited ? <span className="font-mono text-[10px] text-success">+2</span> : undefined,
                },
              ]}
              value={view}
            />
            <div className="flex flex-1 items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button disabled={playing} onClick={replay} size="icon-sm" variant="ghost" aria-label="Replay">
                    <RotateCcw />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Replay the demo</TooltipContent>
              </Tooltip>
              <Button className="hidden lg:inline-flex" size="sm" variant="outline">
                <Share data-icon="inline-start" /> Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Thread actions" size="icon-sm" variant="ghost">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem>
                    <Pin /> Pin thread
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <GitPullRequest /> Open pull request <DropdownMenuShortcut>⌘⇧P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowUpRight /> Open in editor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">Delete thread</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {view === "thread" ? (
            <AgentThread
              composer={{
                placeholder: "Ask for a follow-up, or steer the agent…",
                leading: (
                  <>
                    <div className="mr-1 flex min-w-0 items-center gap-0.5">
                      <ContextUsage total={200_000} used={edited ? 76_000 : playing ? 42_000 : 24_000}>
                        <UsageRow label="Weekly" value="62% left" />
                      </ContextUsage>
                      <ModelPicker onValueChange={setModel} providers={providers} value={model} />
                      {reasons && <EffortPicker fastMode={fast} onFastModeChange={setFast} onValueChange={setEffort} value={effort} />}
                    </div>
                    <ComposerPill icon={Paperclip}>
                      <span className="hidden sm:inline">Attach</span>
                    </ComposerPill>
                    <ComposerPill active={web} className="hidden lg:inline-flex" icon={Globe} onClick={() => setWeb(!web)}>
                      Web
                    </ComposerPill>
                    <ComposerPill active={autoAccept} className="hidden xl:inline-flex" icon={ShieldCheck} onClick={() => setAutoAccept(!autoAccept)}>
                      {autoAccept ? "Auto-accept edits" : "Ask before edits"}
                    </ComposerPill>
                  </>
                ),
              }}
              messages={messages}
              onOpenFile={() => setView("changes")}
              onSend={(text) => play(demoScript(`run-${++runs.current}`, text))}
              onStop={stop}
            />
          ) : (
            <Changes edited={edited} />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}

function hasEdit(messages: ThreadMessage[]) {
  return messages.some((message) => message.role === "assistant" && message.parts.some((part) => part.type === "tool" && part.name === "edit_file" && part.status === "done"))
}

/* ---- Sidebar ----------------------------------------------------------------- */

const groups: Array<{ label: string; threads: Array<{ title: string; time: string; active?: boolean; badge?: string; done?: boolean }> }> = [
  { label: "Pinned", threads: [{ title: "Release checklist", time: "Fri" }] },
  {
    label: "Today",
    threads: [
      { title: "Flaky login test", time: "now", active: true },
      { title: "Migrate to the new router", time: "2h", badge: "#482" },
      { title: "Dark mode for settings", time: "4h", done: true },
    ],
  },
  {
    label: "Earlier",
    threads: [
      { title: "Why is the build slow?", time: "Mon" },
      { title: "Release notes for 0.7", time: "Sep 26" },
      { title: "Flatten the config loader", time: "Sep 24" },
    ],
  },
]

function Sidebar({ playing }: { playing: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col p-2.5 md:flex">
      <div className="flex h-7 items-center gap-1.5 px-1.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <PanelLeft className="ml-auto size-3.5 text-muted-foreground" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mt-3 flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-expanded:bg-sidebar-accent" type="button">
            <span className="grid size-6 place-items-center rounded-md bg-foreground text-[11px] font-semibold text-background">A</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ui font-medium">acme/web</span>
              <span className="block truncate text-[11px] text-muted-foreground">3 agents · main</span>
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuItem>
            acme/web <Check className="ml-auto size-3.5" />
          </DropdownMenuItem>
          <DropdownMenuItem>acme/api</DropdownMenuItem>
          <DropdownMenuItem>acme/mobile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Plus /> Add workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="mt-2 grid gap-px">
        <NavRow icon={Plus} keys="⌘N" label="New thread" />
        <NavRow icon={Search} keys="⌘K" label="Search" />
        <NavRow icon={Timer} label="Automations" trailing={<Badge variant="muted">2</Badge>} />
      </nav>

      <div className="op-scroll -mx-1 mt-3 min-h-0 flex-1 overflow-y-auto px-1">
        {groups.map((group) => (
          <div className="mb-3" key={group.label}>
            <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">{group.label}</p>
            {group.threads.map((thread) => (
              <div
                className={cn(
                  "group flex h-8 items-center gap-2 rounded-lg px-2 text-ui",
                  thread.active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )}
                key={thread.title}
              >
                <span className="grid size-4 shrink-0 place-items-center">
                  {thread.active && playing ? (
                    <Orb kind="working" size={14} />
                  ) : thread.done ? (
                    <span className="size-1.5 rounded-full bg-success" />
                  ) : (
                    <MessageSquare className="size-3.5 opacity-60" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{thread.title}</span>
                {thread.badge ? (
                  <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">{thread.badge}</span>
                ) : (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{thread.time}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="grid gap-2 border-t border-sidebar-border px-1.5 pt-2.5">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Usage this week</span>
            <span className="font-mono">62%</span>
          </div>
          <Meter
            animate={false}
            bands={[
              { key: "agents", value: 44, label: "Agents", className: "bg-foreground/70" },
              { key: "chat", value: 18, label: "Chat", className: "bg-foreground/30" },
            ]}
            height="0.3rem"
            total={100}
          />
        </div>
        <div className="flex items-center gap-2 py-1">
          <span className="grid size-6 place-items-center rounded-full bg-[linear-gradient(135deg,oklch(78%_0.09_250),oklch(70%_0.12_300))] text-[10px] font-semibold text-white">AP</span>
          <span className="min-w-0 flex-1 truncate text-ui">Ada Park</span>
          <Settings className="size-3.5 text-muted-foreground" />
        </div>
      </div>
    </aside>
  )
}

function NavRow({ icon: Icon, label, keys, trailing }: { icon: React.ComponentType<{ className?: string }>; label: string; keys?: string; trailing?: React.ReactNode }) {
  return (
    <div className="group flex h-8 items-center gap-2 rounded-lg px-2 text-ui text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60">
      <Icon className="size-3.5" />
      <span className="flex-1">{label}</span>
      {keys && <Kbd className="opacity-0 transition-opacity group-hover:opacity-100">{keys}</Kbd>}
      {trailing}
    </div>
  )
}

/* ---- Changes view ------------------------------------------------------------ */

const diff: Array<{ kind: "ctx" | "add" | "del" | "hunk"; text: string; n?: number }> = [
  { kind: "hunk", text: "@@ -38,9 +38,10 @@ export async function createSession(user: User) {" },
  { kind: "ctx", n: 38, text: "export async function createSession(user: User) {" },
  { kind: "ctx", n: 39, text: "  const session = await store.create(user)" },
  { kind: "del", n: 40, text: "  setTimeout(() => refreshSession(session.id), 0)" },
  { kind: "add", n: 40, text: "  // Wait for the first refresh, so the cookie is set before we return." },
  { kind: "add", n: 41, text: "  await refreshSession(session.id)" },
  { kind: "ctx", n: 42, text: "  return session" },
  { kind: "ctx", n: 43, text: "}" },
]

function Changes({ edited }: { edited: boolean }) {
  if (!edited) {
    return (
      <div className="grid flex-1 place-items-center p-8 text-center">
        <div>
          <FileCode2 className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-2 text-ui font-medium">No changes yet</p>
          <p className="mt-1 text-ui-sm text-muted-foreground">Edits the agent makes will show up here.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="op-scroll flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-ui text-muted-foreground">
            1 file changed · <span className="text-success">+2</span> <span className="text-destructive">−1</span>
          </p>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost">
              Discard
            </Button>
            <Button size="sm">
              <GitPullRequest data-icon="inline-start" /> Open PR
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-[var(--code-background)]">
          <div className="flex items-center gap-2 border-b px-3 py-2 font-mono text-[12px]">
            <FileCode2 className="size-3.5 text-muted-foreground" />
            src/auth/session.ts
            <span className="ml-auto text-success">+2</span>
            <span className="text-destructive">−1</span>
          </div>
          <pre className="overflow-x-auto py-1 font-mono text-[12px] leading-[1.7]">
            {diff.map((line, index) => (
              <div
                className={cn(
                  "flex px-3",
                  line.kind === "add" && "op-tok-added",
                  line.kind === "del" && "op-tok-removed",
                  line.kind === "hunk" && "text-muted-foreground/70",
                )}
                key={index}
              >
                <span className="w-8 shrink-0 text-right text-muted-foreground/50 select-none">{line.n ?? ""}</span>
                <span className={cn("w-5 shrink-0 text-center select-none", line.kind === "add" ? "text-success" : line.kind === "del" ? "text-destructive" : "text-transparent")}>
                  {line.kind === "add" ? "+" : line.kind === "del" ? "−" : " "}
                </span>
                <span className="whitespace-pre">{line.text}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  )
}

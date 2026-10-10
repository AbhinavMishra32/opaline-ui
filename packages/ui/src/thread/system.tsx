import * as React from "react"
import { CheckCircle2, ChevronRight, Info, TriangleAlert, XCircle } from "lucide-react"
import { cn } from "../lib/utils"
import type { SystemMessage as SystemMessageData } from "./types"

type Tone = NonNullable<SystemMessageData["tone"]>

const INK: Record<Tone, string> = {
  neutral: "text-muted-foreground/85",
  success: "text-[var(--success)]",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-[var(--reference)]",
}

const RULE_INK: Record<Tone, string> = {
  neutral: "var(--border-surface-strong)",
  success: "color-mix(in oklab, var(--success) 40%, var(--border-surface-strong))",
  warning: "color-mix(in oklab, var(--warning) 40%, var(--border-surface-strong))",
  danger: "color-mix(in oklab, var(--destructive) 40%, var(--border-surface-strong))",
  info: "color-mix(in oklab, var(--reference) 40%, var(--border-surface-strong))",
}

const ICONS: Record<Tone, React.ComponentType<{ className?: string }>> = {
  neutral: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: XCircle,
  info: Info,
}

/** The first sentence as a title (when it is short enough to be one), the rest as detail. */
export function splitSentence(text: string): { title: string; detail: string } {
  const clean = text.trim()
  const sentence = clean.match(/^(.+?[.!?])(?:\s+|$)/s)?.[1]
  if (sentence && sentence.length <= 140) return { title: sentence.replace(/[.!?]$/, ""), detail: clean.slice(sentence.length).trim() }
  if (clean.length <= 140 && !clean.includes("\n")) return { title: clean, detail: "" }
  return { title: "", detail: clean }
}

/** An icon row in the step column: what happened, and a line under it. */
export function SystemRow({
  icon: Icon,
  title,
  meta,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>
  title: React.ReactNode
  meta?: React.ReactNode
  tone?: Tone
}) {
  return (
    <div className="-mx-1 flex min-w-0 items-center gap-2 px-1 py-1.5 text-thread" data-role="system" role="note">
      <span aria-hidden className="grid size-6 shrink-0 place-items-center">
        <Icon className={cn("size-3.5", INK[tone])} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground/85">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-thread-tool text-muted-foreground">{meta}</span>}
      </span>
    </div>
  )
}

/**
 * A line between turns.
 *
 * - `event` (default): an icon row; the first sentence titles it and the rest
 *   opens behind a disclosure.
 * - `rule`: a milestone between gradient hairlines — "Solved · 3 checks".
 * - `divider`: a quiet centred line between two rules.
 */
export function SystemMessage({ message }: { message: SystemMessageData }) {
  const tone = message.tone ?? "neutral"
  const variant = message.variant ?? "event"
  const split = splitSentence(message.text)
  const title = message.title ?? (split.title || "System update")
  const detail = message.detail ?? (message.title ? message.text : split.detail)
  const Icon = message.icon ?? ICONS[tone]

  if (variant === "divider") {
    return (
      <div className="flex items-center gap-3 text-thread-tool text-muted-foreground" data-role="system" role="note">
        <span className="h-px flex-1 bg-border/70" />
        <span className="min-w-0 truncate">{message.title ?? message.text}</span>
        <span className="h-px flex-1 bg-border/70" />
      </div>
    )
  }

  if (variant === "rule") {
    return (
      <div aria-label={detail ? `${title} — ${detail}` : title} className="flex min-w-0 items-center gap-2.5 py-1" data-role="system" role="note">
        <Rule side="left" tone={tone} />
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="grid size-4 shrink-0 place-items-center">
            <Icon className={cn("size-3.5", tone === "neutral" ? "text-muted-foreground" : INK[tone])} />
          </span>
          <span className={cn("shrink-0 text-thread font-semibold tracking-[-0.01em]", tone === "neutral" ? "text-foreground/85" : INK[tone])}>{title}</span>
          {detail && (
            <>
              <span aria-hidden className="shrink-0 text-muted-foreground/40">
                ·
              </span>
              <span className="min-w-0 truncate text-thread-tool text-muted-foreground">{detail}</span>
            </>
          )}
        </span>
        <Rule side="right" tone={tone} />
      </div>
    )
  }

  if (!detail) return <SystemRow icon={Icon} title={title} tone={tone} />
  return <SystemDisclosure detail={detail} icon={Icon} title={title} tone={tone} />
}

function SystemDisclosure({ icon: Icon, title, detail, tone }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string; tone: Tone }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="min-w-0" data-role="system" role="note">
      <button
        aria-expanded={open}
        className="-mx-1 flex w-[calc(100%+0.5rem)] min-w-0 cursor-default items-center gap-2 px-1 py-1.5 text-left text-thread text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden className="grid size-6 shrink-0 place-items-center">
          <Icon className={cn("size-3.5", INK[tone])} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground/85">{title}</span>
          {!open && <span className="mt-0.5 block truncate text-thread-tool text-muted-foreground">{detail}</span>}
        </span>
        <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <p className="mt-1 ml-7 min-w-0 border-l border-border/70 py-1 pl-3 text-thread leading-[1.6] break-words whitespace-pre-wrap text-muted-foreground/85">{detail}</p>
      )}
    </div>
  )
}

function Rule({ side, tone }: { side: "left" | "right"; tone: Tone }) {
  return <span aria-hidden className="h-px min-w-3 flex-1" style={{ background: `linear-gradient(to ${side === "left" ? "right" : "left"}, transparent, ${RULE_INK[tone]})` }} />
}

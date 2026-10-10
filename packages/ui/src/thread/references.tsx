import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip"
import { useThreadConfig } from "./config"
import { IconFile, IconSparkle } from "./threadIcons"

/**
 * The agent's own references, made live: `[[file:main.py|main.py]]`,
 * `[[doc:setup|the setup guide]]`. The kind is any lowercase word; what each
 * kind opens is the host's business, through `references.onOpen`.
 */
export type Reference = { kind: string; target: string; label: string }

export const REFERENCE_PATTERN = /\[\[([a-z][\w-]*):([^\]|]+?)(?:\|([^\]]*))?\]\]/

export function parseReference(value: string): Reference | null {
  const match = REFERENCE_PATTERN.exec(value)
  if (!match) return null
  const target = match[2]!.trim()
  return { kind: match[1]!, target, label: (match[3] ?? "").trim() || target }
}

const REFERENCE_PATTERN_ALL = new RegExp(REFERENCE_PATTERN.source, "g")

/** Every reference a message made, once each, in the order it made them. */
export function collectReferences(source: string): Reference[] {
  const seen = new Set<string>()
  const found: Reference[] = []
  for (const match of source.matchAll(REFERENCE_PATTERN_ALL)) {
    const parsed = parseReference(match[0])
    if (!parsed) continue
    const key = `${parsed.kind}:${parsed.target}`
    if (seen.has(key)) continue
    seen.add(key)
    found.push(parsed)
  }
  return found
}

export type ReferenceTagTone = "reference" | "success" | "destructive" | "muted"

const TONE: Record<ReferenceTagTone, string> = {
  reference: "bg-[color-mix(in_oklab,var(--reference)_13%,transparent)] text-[var(--reference-strong)]",
  success: "bg-[color-mix(in_oklab,var(--success)_13%,transparent)] text-[var(--success)]",
  destructive: "bg-[color-mix(in_oklab,var(--destructive)_11%,transparent)] text-destructive",
  muted: "bg-secondary text-muted-foreground",
}

/* The same tones as ink rather than paint, for a tag inside a sentence. */
const INK: Record<ReferenceTagTone, string> = {
  reference: "text-[var(--reference)] hover:text-[var(--reference-strong)]",
  success: "text-[var(--success)]",
  destructive: "text-destructive",
  muted: "text-muted-foreground hover:text-foreground",
}

const HOVER: Record<ReferenceTagTone, string> = {
  reference: "hover:bg-[color-mix(in_oklab,var(--reference)_22%,transparent)]",
  success: "hover:bg-[color-mix(in_oklab,var(--success)_22%,transparent)]",
  destructive: "hover:bg-[color-mix(in_oklab,var(--destructive)_20%,transparent)]",
  muted: "hover:bg-accent",
}

export type ReferenceTagProps = Omit<React.ComponentProps<"span">, "onClick" | "title"> & {
  glyph?: React.ReactNode
  label: string
  /** A quiet marker before the name — an ordinal, usually. */
  lead?: React.ReactNode
  /** What is worth knowing after the name — an outcome, a count. */
  note?: React.ReactNode
  onClick?: () => void
  onRemove?: () => void
  removeLabel?: string
  title?: string
  tone?: ReferenceTagTone
  /** `inline` is ink in a sentence; `chip` is filled, for a tag standing alone. */
  variant?: "inline" | "chip"
}

/**
 * The one shape a reference takes: coloured text in a sentence, or a filled
 * chip standing on its own (over the composer, say) that can be dismissed.
 */
export const ReferenceTag = React.forwardRef<HTMLSpanElement, ReferenceTagProps>(function ReferenceTag(
  { className, glyph, label, lead, note, onClick, onRemove, removeLabel, title, tone = "reference", variant = "inline", ...anchored },
  ref,
) {
  const Tag = onClick ? "button" : "span"
  const chip = variant === "chip"
  return (
    <span
      ref={ref}
      {...anchored}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1 align-[-0.15em] font-medium transition-colors",
        chip ? cn("rounded-[6px] py-[0.5px] pl-1 pr-1.5", TONE[tone], onClick && HOVER[tone], onRemove && "pr-0.5") : INK[tone],
        onClick && "cursor-pointer",
        className,
      )}
    >
      <Tag
        className={cn(
          "inline-flex min-w-0 items-center gap-1 rounded-[4px] underline-offset-[3px] outline-none focus-visible:ring-1 focus-visible:ring-ring",
          !chip && onClick && "hover:underline",
        )}
        onClick={onClick}
        title={title}
        {...(onClick ? { type: "button" as const } : {})}
      >
        {glyph && (
          <span aria-hidden className="grid size-3.5 shrink-0 place-items-center">
            {glyph}
          </span>
        )}
        {lead != null && <span className="shrink-0 tabular-nums opacity-55">{lead}</span>}
        <span className="min-w-0 truncate">{label}</span>
        {note != null && <span className="min-w-0 shrink-[2] truncate font-normal opacity-60">{note}</span>}
      </Tag>
      {onRemove && (
        <button
          aria-label={removeLabel ?? `Remove ${label}`}
          className="grid size-4 shrink-0 place-items-center rounded-[4px] opacity-55 outline-none transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
          onClick={onRemove}
          type="button"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
})

/**
 * A reference in prose. Plain text when nothing can open it — a blue word that
 * does nothing is worse than the black one it replaced. A file reference
 * asks `references.exists` first and, when the file is missing, offers to
 * create it instead. The answer is the host's to know: `exists` is a plain
 * lookup into data the host already holds, never a fetch the link runs.
 */
export function ReferenceLink({ kind, target, label }: Reference) {
  const { references, onOpenFile } = useThreadConfig()
  const present = references?.exists ? references.exists({ kind, target }) : true

  const open = references?.onOpen ?? (kind === "file" && onOpenFile ? () => onOpenFile(target) : undefined)
  const Icon = references?.icon?.(kind) ?? (kind === "file" ? IconFile : undefined)
  const glyph = Icon ? <Icon className="size-3" /> : undefined

  if (!open) return <span className="font-medium">{label}</span>
  if (present) return <ReferenceTag glyph={glyph} label={label} onClick={() => open({ kind, target, label })} title={target} />

  const create = references?.onCreate
  if (!create) return <span className="font-medium text-muted-foreground">{label}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ReferenceTag glyph={glyph} label={label} onClick={() => create({ kind, target, label })} tone="muted" />
      </TooltipTrigger>
      <TooltipContent>
        Create <code className="font-mono">{target}</code>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * What the reply pointed at, gathered under it as quiet pills — the second
 * reading of the blue words, for "what should I open now". Only the kinds
 * listed in `references.footer` are gathered.
 */
export function ReferenceCards({ source, className }: { source: string; className?: string }) {
  const { references } = useThreadConfig()
  const kinds = references?.footer
  const open = references?.onOpen
  if (!kinds?.length || !open) return null
  const shown = collectReferences(source).filter((reference) => kinds.includes(reference.kind))
  if (shown.length === 0) return null

  return (
    <div className={cn("mt-3 flex flex-wrap gap-2", className)}>
      {shown.map((reference) => {
        const Icon = references.icon?.(reference.kind) ?? IconSparkle
        return (
          <button
            className="op-pill flex w-max min-w-0 max-w-[16rem] shrink-0 items-center gap-1.5 bg-elevated/60 py-1 pr-3 pl-2.5 text-left text-muted-foreground outline-none transition-colors hover:bg-elevated hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            key={`${reference.kind}:${reference.target}`}
            onClick={() => open(reference)}
            title={reference.target}
            type="button"
          >
            <Icon className="size-3 shrink-0 opacity-70" />
            <span className="min-w-0 truncate text-thread-tool">{reference.label}</span>
          </button>
        )
      })}
    </div>
  )
}

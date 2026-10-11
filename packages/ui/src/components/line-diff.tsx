import * as React from "react"
import { cn } from "../lib/utils"
import { diffCounts, lineDiff, wordDiff, type DiffLine } from "../lib/line-diff"

/**
 * Two versions of a text, compared: added lines green, removed red, the
 * words that changed on an edited line marked, unchanged lines dimmed, and
 * long unchanged stretches folded away.
 *
 *   <LineDiffView before={version3} after={version4} />
 *   <DiffCounts added={2} removed={1} />                →  +2 −1
 *
 * Ported from Spar's notebook view.
 */

/** Unchanged lines kept either side of a change. The rest fold away. */
const CONTEXT = 2

type Segment = { kind: "lines"; lines: DiffLine[] } | { kind: "fold"; lines: DiffLine[] }

function segments(diff: DiffLine[]): Segment[] {
  const keep = diff.map(() => false)
  diff.forEach((line, index) => {
    if (line.kind === "same") return
    for (let offset = -CONTEXT; offset <= CONTEXT; offset += 1) {
      if (index + offset >= 0 && index + offset < diff.length) keep[index + offset] = true
    }
  })

  const out: Segment[] = []
  diff.forEach((line, index) => {
    const kind = keep[index] ? "lines" : "fold"
    const tail = out[out.length - 1]
    if (tail?.kind === kind) tail.lines.push(line)
    else out.push({ kind, lines: [line] })
  })
  // A fold of one or two lines hides nothing worth a click.
  return out.map((segment) => (segment.kind === "fold" && segment.lines.length < 3 ? { kind: "lines", lines: segment.lines } : segment))
}

function DiffRow({ line }: { line: DiffLine }) {
  let mark = " "
  if (line.kind === "added") mark = "+"
  if (line.kind === "removed") mark = "−"

  return (
    <div
      className={cn(
        "flex min-w-0 gap-2 px-3",
        line.kind === "added" && "bg-[color-mix(in_srgb,var(--success)_11%,transparent)] text-[var(--success)]",
        line.kind === "removed" && "bg-destructive/10 text-destructive",
        line.kind === "same" && "text-muted-foreground/70",
      )}
    >
      <span aria-hidden className="w-2.5 shrink-0 select-none opacity-70">
        {mark}
      </span>
      <span className="sr-only">{line.kind === "added" ? "Added: " : line.kind === "removed" ? "Removed: " : ""}</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
        {line.spans
          ? line.spans.map((span, index) =>
              span.changed ? (
                <mark
                  className={cn(
                    "rounded-[3px] text-inherit",
                    line.kind === "added" ? "bg-[color-mix(in_srgb,var(--success)_32%,transparent)]" : "bg-destructive/30",
                  )}
                  key={index}
                >
                  {span.text}
                </mark>
              ) : (
                <span key={index}>{span.text}</span>
              ),
            )
          : line.text || " "}
      </span>
    </div>
  )
}

function Fold({ lines }: { lines: DiffLine[] }) {
  const [open, setOpen] = React.useState(false)
  if (open) {
    return (
      <>
        {lines.map((line, index) => (
          <DiffRow key={index} line={line} />
        ))}
      </>
    )
  }
  return (
    <button
      className="block w-full cursor-default px-3 py-0.5 text-left text-muted-foreground/60 outline-none transition-colors hover:bg-accent hover:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
      onClick={() => setOpen(true)}
      type="button"
    >
      ⋯ {lines.length} unchanged lines
    </button>
  )
}

/** A line diff between two versions of a text. `before` null: everything was added. */
export function LineDiffView({
  before,
  after,
  empty = "No changes.",
  className,
}: {
  before: string | null
  after: string
  /** What to say when the two are the same. */
  empty?: string
  className?: string
}) {
  const diff = React.useMemo(() => wordDiff(lineDiff(before, after)), [before, after])
  const parts = React.useMemo(() => segments(diff), [diff])

  if (!diff.some((line) => line.kind !== "same")) {
    return <p className={cn("px-3 py-2 text-thread-tool text-muted-foreground", className)}>{empty}</p>
  }
  return (
    <div className={cn("py-1.5 font-mono text-thread-tool leading-[1.6]", className)}>
      {parts.map((segment, index) =>
        segment.kind === "fold" ? (
          <Fold key={index} lines={segment.lines} />
        ) : (
          segment.lines.map((line, offset) => <DiffRow key={`${index}-${offset}`} line={line} />)
        ),
      )}
    </div>
  )
}

/** How many lines were added and removed: +2 −1. Nothing when the two are the same. */
export function DiffCounts({ added, removed, className }: { added: number; removed: number; className?: string }) {
  if (!added && !removed) return null
  return (
    <span className={cn("shrink-0 font-mono tabular-nums", className)}>
      {added > 0 && <span className="text-[var(--success)]">+{added}</span>}
      {added > 0 && removed > 0 && " "}
      {removed > 0 && <span className="text-destructive">−{removed}</span>}
    </span>
  )
}

export { diffCounts, lineDiff, wordDiff, type DiffLine }

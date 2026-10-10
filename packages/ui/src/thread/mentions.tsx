/**
 * The `@` picker: the list that opens over the composer while a mention is
 * being typed.
 *
 * It shows the host's `mentions` (a plain list it passes to the composer),
 * narrowed by what follows the `@`. An item with `children` opens onto them,
 * with the item itself offered first, so "this problem" and "an attempt at
 * it" are both a keystroke away. A panel over the composer rather than a
 * dropdown at the caret: the caret moves while you type, and a list that moves
 * with it is a list you cannot read.
 *
 * Focus never leaves the field. The keys that drive the list are caught on the
 * window before the textarea sees them (the composer ignores them while this
 * is open), so typing, the caret and the input method keep working.
 */
import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"
import { useThreadConfig } from "./config"
import { mentionMatches, mentionSpans, type MentionItem } from "./mention-text"

/** At most this many rows are drawn at one level. */
const MAX_ROWS = 40

type Row = {
  item: MentionItem
  /** Opens onto the item's children rather than inserting it. */
  opens: boolean
  section: string | undefined
}

/** The rows for one level of the picker. */
export function mentionRows(items: readonly MentionItem[], parent: MentionItem | null, query: string, itselfLabel: string): Row[] {
  const rows: Row[] = []
  if (parent) {
    const itself: MentionItem = { ...parent, children: [] }
    if (mentionMatches(itself, query)) rows.push({ item: itself, opens: false, section: itselfLabel })
  }
  for (const item of items) {
    const opens = Boolean(item.children && item.children.length > 0)
    const childMatches = opens && item.children!.some((child) => mentionMatches(child, query))
    if (!mentionMatches(item, query) && !childMatches) continue
    rows.push({ item, opens, section: item.section })
    if (rows.length >= MAX_ROWS) break
  }
  return rows
}

export function MentionPicker({
  items,
  query,
  onPick,
  onClose,
}: {
  items: readonly MentionItem[]
  query: string
  onPick: (item: MentionItem) => void
  onClose: () => void
}) {
  const { labels } = useThreadConfig()
  /* The items opened on the way down: the last one is where the list is. */
  const [trail, setTrail] = React.useState<MentionItem[]>([])
  const [active, setActive] = React.useState(0)
  const list = React.useRef<HTMLDivElement>(null)

  const parent = trail.at(-1) ?? null
  const levelItems = parent ? (parent.children ?? []) : items
  const rows = React.useMemo(() => mentionRows(levelItems, parent, query, labels.mentionItself), [levelItems, parent, query, labels.mentionItself])

  React.useEffect(() => setActive(0), [trail, query])

  const choose = React.useCallback(
    (row: Row) => {
      if (row.opens) {
        setTrail((current) => [...current, row.item])
        return
      }
      onPick(row.item)
    },
    [onPick],
  )

  const back = React.useCallback(() => {
    setTrail((current) => current.slice(0, -1))
  }, [])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const handled = handlePickerKey(event.key, { rows, active, atRoot: trail.length === 0, setActive, choose, back, onClose })
      if (handled) event.preventDefault()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [rows, active, trail.length, choose, back, onClose])

  React.useEffect(() => {
    const row = list.current?.querySelector<HTMLElement>('[data-active="true"]')
    row?.scrollIntoView({ block: "nearest" })
  }, [active, rows.length])

  return (
    <div
      className="op-menu absolute bottom-full left-0 z-30 mb-2 w-auto min-w-[20rem] max-w-full overflow-hidden p-2"
      data-slot="mention-picker"
      onMouseDown={(event) => event.preventDefault()}
    >
      {parent && <Crumbs onRoot={() => setTrail([])} trail={trail} />}
      <div className="op-scroll max-h-[17rem] min-w-0 overflow-y-auto" ref={list} role="listbox">
        {rows.length === 0 && <p className="px-2.5 py-2 text-thread text-muted-foreground/70">{labels.mentionEmpty(query)}</p>}
        {rows.map((row, index) => {
          const previousSection = rows[index - 1]?.section
          const startsSection = row.section !== undefined && row.section !== previousSection
          const isActive = index === active
          const Icon = row.item.icon
          return (
            <div key={`${row.item.kind}:${row.item.id}:${index}`}>
              {startsSection && <p className="px-2.5 pt-2 pb-1 text-thread text-muted-foreground/60 first:pt-0.5">{row.section}</p>}
              <button
                aria-selected={isActive}
                className={cn("flex w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left outline-none", isActive && "bg-elevated")}
                data-active={isActive}
                onClick={() => choose(row)}
                onMouseMove={() => setActive(index)}
                role="option"
                type="button"
              >
                <span aria-hidden className="grid size-4 shrink-0 place-items-center text-muted-foreground">
                  {Icon ? <Icon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current opacity-50" />}
                </span>
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="shrink-0 truncate text-thread font-medium text-foreground">{row.item.label}</span>
                  {row.item.detail && <span className="min-w-0 truncate text-thread text-muted-foreground/70">{row.item.detail}</span>}
                </span>
                {row.opens && (
                  <ChevronRight aria-hidden className={cn("size-3.5 shrink-0", isActive ? "text-muted-foreground/60" : "text-muted-foreground/25")} />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type PickerKeyContext = {
  rows: Row[]
  active: number
  atRoot: boolean
  setActive: React.Dispatch<React.SetStateAction<number>>
  choose: (row: Row) => void
  back: () => void
  onClose: () => void
}

/** One key, while the picker is open. Returns whether the picker took it. */
function handlePickerKey(key: string, context: PickerKeyContext): boolean {
  const count = context.rows.length
  if (key === "Escape") {
    if (context.atRoot) context.onClose()
    else context.back()
    return true
  }
  if (key === "ArrowDown") {
    context.setActive((current) => (count > 0 ? (current + 1) % count : 0))
    return true
  }
  if (key === "ArrowUp") {
    context.setActive((current) => (count > 0 ? (current - 1 + count) % count : 0))
    return true
  }
  if (key === "ArrowLeft" && !context.atRoot) {
    context.back()
    return true
  }
  const row = context.rows[context.active]
  if (!row) return false
  if ((key === "ArrowRight" || key === "Tab") && row.opens) {
    context.choose(row)
    return true
  }
  if (key === "Enter") {
    context.choose(row)
    return true
  }
  return false
}

/** Where the list is, and the way back up. Only drawn below the top level. */
function Crumbs({ trail, onRoot }: { trail: MentionItem[]; onRoot: () => void }) {
  const { labels } = useThreadConfig()
  return (
    <div className="flex min-w-0 items-center gap-1.5 px-2.5 pt-0.5 pb-1.5 text-thread text-muted-foreground/60">
      <button className="shrink-0 rounded-[3px] outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring" onClick={onRoot} type="button">
        {labels.mentionRoot}
      </button>
      {trail.map((item) => (
        <span className="flex min-w-0 items-center gap-1.5" key={`${item.kind}:${item.id}`}>
          <ChevronRight aria-hidden className="size-3 shrink-0 text-muted-foreground/40" />
          <span className="min-w-0 truncate text-foreground/75">{item.label}</span>
        </span>
      ))}
    </div>
  )
}

/**
 * The layer under the composer's textarea that draws picked mentions as tags.
 * The person's text stays in the textarea — caret, selection, undo and input
 * methods all keep working — and this draws only the tag shapes, from the same
 * characters at the same metrics, so a tag sits exactly under its words
 * however the draft wraps. The composer keeps its scroll in step with the field.
 */
export const MentionTags = React.forwardRef<HTMLDivElement, { text: string; tokens: readonly string[] }>(function MentionTags({ text, tokens }, ref) {
  const pieces = React.useMemo(() => splitAtMentions(text, tokens), [text, tokens])
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden px-1.5 py-1 text-thread leading-[1.55] break-words whitespace-pre-wrap text-transparent"
      ref={ref}
    >
      {pieces.map((piece, index) => {
        if (!piece.tag) return <span key={index}>{piece.text}</span>
        return (
          <span
            className="rounded-[5px] bg-[color-mix(in_oklab,var(--reference)_16%,transparent)] ring-[0.5px] ring-[color-mix(in_oklab,var(--reference)_40%,transparent)] ring-inset [box-decoration-break:clone]"
            key={index}
          >
            {piece.text}
          </span>
        )
      })}
      {/* A draft ending in a newline leaves the layer a line short without this. */}
      {"\n"}
    </div>
  )
})

/** The draft cut at its tag boundaries. */
function splitAtMentions(text: string, tokens: readonly string[]): Array<{ tag: boolean; text: string }> {
  const spans = mentionSpans(text, tokens)
  const pieces: Array<{ tag: boolean; text: string }> = []
  let cursor = 0
  for (const span of spans) {
    if (span.start > cursor) pieces.push({ tag: false, text: text.slice(cursor, span.start) })
    pieces.push({ tag: true, text: text.slice(span.start, span.end) })
    cursor = span.end
  }
  if (cursor < text.length) pieces.push({ tag: false, text: text.slice(cursor) })
  return pieces
}

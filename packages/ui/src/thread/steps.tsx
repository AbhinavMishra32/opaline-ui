import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ThinkingOrb } from "thinking-orbs"
import { cn } from "../lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/collapsible"
import { useThreadConfig } from "./config"
import { IconAlert, IconChevronRight, IconDot, IconThinking, IconWaiting, LiveMark } from "./threadIcons"
import { latestHeading, thoughts } from "./thoughts"
import { defaultToolView, isBareKind } from "./tool-views"
import { formatPayload, looksLikePath, resolveTool } from "./tools"
import { useRevealOnExpand } from "./use-reveal-on-expand"
import type { ErrorPart, OrbKind, ReasoningPart, StatusPart, ToolPart } from "./types"

/* ---- Geometry ---------------------------------------------------------------
   A step is a 24px gutter, a 6px gap, then its label. The gap to the next step
   lives inside the block as padding rather than outside it as margin, because
   margin is space the thread's line cannot cross. Consecutive steps sit tight
   as one cluster and prose gets the room: the contrast is what makes a long
   turn scannable before a word of it is read. */

export const PROSE_GAP = "0.75rem"
export const CARD_GAP = "0.5rem"
export const FINAL_GAP = "0.875rem"
export const UNDER_LABEL = "1.625rem"

/** The icon column every row hangs its mark in, reserved even when empty. */
export const ROW_GLYPH = "relative z-10 flex size-6 shrink-0 items-center justify-center [&>svg]:size-4"
const ROW = "relative inline-flex w-fit min-w-0 max-w-full items-center gap-2.5 px-1.5 py-[3px] text-left text-thread"
/* No hand cursor: a list of rows keeps the arrow, as a desktop list does. */
const TRIGGER = "group/row cursor-default p-0 text-[var(--transcript-step)] transition-colors outline-none hover:text-[var(--transcript-step-strong)] focus-visible:text-[var(--transcript-step-strong)]"
const LABEL_ROW = "flex min-h-6 w-full min-w-0 items-center justify-start gap-1 overflow-hidden text-left text-thread"
/** The thread down the gutter. Starts under the mark, runs to the block's foot. */
const RAIL = "bg-[var(--transcript-rail)] absolute top-[21px] -bottom-px left-1/2 w-[0.5px] -translate-x-1/2"
/** The last step draws no line — except while its own panel is open. */
const RAIL_LAST = "hidden bottom-2 group-data-[state=open]/step:block"
const MARK = "size-4"

/* ---- Motion ----------------------------------------------------------------- */

/**
 * How a step arrives: up eight pixels on a spring with a little bounce, and a
 * fraction under full size on the way. The scale is what makes a row read as
 * coming forward into the transcript rather than sliding up it, held to 1.5%
 * so glyphs never visibly re-render. Only mounts animate.
 */
export function useArrival(card = false) {
  const { reduced } = useThreadConfig()
  return {
    initial: { opacity: 0, y: reduced ? 0 : card ? 14 : 8, scale: reduced ? 1 : card ? 0.97 : 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: reduced
      ? { duration: 0.1 }
      : {
          type: "spring" as const,
          visualDuration: card ? 0.5 : 0.38,
          bounce: card ? 0.08 : 0.16,
          opacity: { duration: card ? 0.24 : 0.16, ease: "easeOut" as const },
        },
  }
}

/** The mark lands a beat behind its row, with more bounce: the transcript stamping the line it just wrote. */
function useMarkArrival() {
  const { reduced } = useThreadConfig()
  if (reduced) return { initial: false as const, animate: { opacity: 1, scale: 1 } }
  return {
    initial: { opacity: 0, scale: 0.72 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring" as const, visualDuration: 0.34, bounce: 0.42, delay: 0.06, opacity: { duration: 0.14, delay: 0.06 } },
  }
}

/* ---- Small parts ------------------------------------------------------------ */

/** An animated orb: the mark of work in progress. */
export function Orb({ kind = "working", size = 15, label = "Working", className }: { kind?: OrbKind; size?: number; label?: string; className?: string }) {
  return (
    <ThinkingOrb
      aria-label={label}
      className={className}
      size={size > 40 ? 64 : size > 24 ? 32 : 20}
      state={kind}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * The caret that opens a row, hidden until it is wanted. A dozen carets down a
 * transcript are a dozen pieces of furniture; it fades in on hover and stays
 * while the row is open. Faded rather than removed, so hovering never resizes
 * a row that is only as wide as its words.
 */
export function Caret({ open, standing = false, className }: { open: boolean; standing?: boolean; className?: string }) {
  return (
    <IconChevronRight
      className={cn(
        "size-4 shrink-0 text-[var(--transcript-step-mark)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        standing ? "opacity-100" : "opacity-0 group-hover/row:opacity-100 group-focus-visible/row:opacity-100",
        open && "rotate-90 opacity-100",
        className,
      )}
    />
  )
}

export function DiffStat({ added, removed }: { added: number; removed: number }) {
  if (added === 0 && removed === 0) return null
  return (
    <span className="shrink-0 font-mono text-thread-tool tabular-nums">
      {added > 0 && <span className="text-[var(--success)]">+{added}</span>}
      {added > 0 && removed > 0 && " "}
      {removed > 0 && <span className="text-destructive">-{removed}</span>}
    </span>
  )
}

function took(part: ToolPart): string {
  if (part.status === "running" || !part.startedAt || !part.endedAt) return ""
  const seconds = (part.endedAt - part.startedAt) / 1000
  return seconds < 1 ? "" : `in ${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`
}

function oneLine(value: string, limit = 72): string {
  const line = value.replace(/\s+/g, " ").trim()
  return line.length > limit ? `${line.slice(0, limit - 1)}…` : line
}

/**
 * A scroller held to a height, fading at whichever end has more. Live content
 * can follow its own tail, so opening a streaming thought shows where the model
 * is rather than the paragraph it opened with.
 */
export function FadedScroll({
  children,
  className,
  follow = false,
  watch,
  uncapped = false,
}: {
  children: React.ReactNode
  className?: string
  follow?: boolean
  watch?: unknown
  uncapped?: boolean
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const [fade, setFade] = React.useState<"none" | "top" | "bottom" | "both">("none")
  const measure = React.useCallback(() => {
    const node = box.current
    if (!node) return
    const above = node.scrollTop > 1
    const below = node.scrollTop + node.clientHeight < node.scrollHeight - 1
    setFade(above && below ? "both" : above ? "top" : below ? "bottom" : "none")
  }, [])
  React.useLayoutEffect(() => {
    const node = box.current
    if (!node) return
    if (follow) node.scrollTop = node.scrollHeight
    measure()
  }, [follow, measure, watch, uncapped])
  return (
    <div
      className={cn("op-faded op-scroll min-w-0", className)}
      data-fade={fade}
      onScroll={measure}
      ref={box}
      {...(uncapped ? { style: { maxHeight: "none" } } : {})}
    >
      {children}
    </div>
  )
}

/** A tool's own text — arguments or result — with a name and an optional verdict. */
export function Payload({ title, body, status }: { title: string; body: string; status?: string }) {
  const { labels } = useThreadConfig()
  const [full, setFull] = React.useState(false)
  const trimmed = body.trim()
  if (!trimmed) return null
  const lines = trimmed.split("\n").length
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-baseline justify-between gap-2 px-2.5 pt-2 pb-1">
        <p className="min-w-0 truncate font-medium text-foreground/75">{title}</p>
        {status && <span className="shrink-0 text-muted-foreground/70">{status}</span>}
      </div>
      <FadedScroll uncapped={full} watch={body}>
        <pre className="px-2.5 pb-2 font-mono leading-[1.45] whitespace-pre text-muted-foreground/80">{trimmed}</pre>
      </FadedScroll>
      {lines > 8 && (
        <button
          className="mx-2.5 mb-2 cursor-default rounded-md bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setFull((value) => !value)}
          type="button"
        >
          {full ? labels.collapseOutput : labels.showFullOutput(lines)}
        </button>
      )}
    </div>
  )
}

/** Input over output, divided by a hairline. The fallback panel for any tool without a view. */
export function RawPayload({ input, output, status }: { input: unknown; output: unknown; status?: string }) {
  const { labels } = useThreadConfig()
  const formattedInput = formatPayload(input)
  const formattedOutput = formatPayload(output)
  return (
    <>
      <Payload body={formattedInput} title={labels.input} />
      {formattedInput.trim() && formattedOutput.trim() && <div className="mx-2.5 border-t border-border/60" />}
      <Payload body={formattedOutput} title={labels.output} {...(status ? { status } : {})} />
    </>
  )
}

/* ---- Rows ------------------------------------------------------------------- */

/** A row on the thread: the mark in its gutter, the rail down to the next step. */
export function StepRow({
  mark,
  markKey,
  continues = false,
  children,
  className,
}: {
  mark: React.ReactNode
  /** Changing this crosses the old mark out and the new one in. */
  markKey: string
  continues?: boolean
  children: React.ReactNode
  className?: string
}) {
  const arrival = useArrival()
  const markIn = useMarkArrival()
  const { reduced } = useThreadConfig()
  return (
    <motion.div {...arrival} className={cn("relative -ml-1 flex min-w-0 items-start gap-1.5", continues && "pb-1", className)}>
      <div className="relative flex min-h-6 w-6 shrink-0 items-start justify-center self-stretch">
        {continues && <span aria-hidden className={RAIL} />}
        <motion.span className={cn(ROW_GLYPH, "text-[var(--transcript-step-mark)]")} {...markIn}>
          <MarkSwap markKey={markKey} reduced={reduced}>{mark}</MarkSwap>
        </motion.span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.div>
  )
}

/** Two marks crossing on a scale in the same box, so a step finishing never costs a reflow. */
function MarkSwap({ markKey, reduced, children }: { markKey: string; reduced: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      <motion.span
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 grid place-items-center [&>svg]:size-4"
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        initial={reduced ? false : { opacity: 0, scale: 0.6 }}
        key={markKey}
        transition={reduced ? { duration: 0 } : { type: "spring", visualDuration: 0.3, bounce: 0.3 }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}

/**
 * One tool call: its mark, what it did and to what, and the panel it opens.
 *
 * `Read main.py`, not `Read a file`: a column of bare verbs says five things
 * happened and nothing about which. The mark is the tool's own glyph, pulsing
 * while the call runs and still once it lands. Success is silent — a column of green
 * badges is noise; the one that says Failed is the one worth seeing.
 */
export function ToolStep({
  part,
  continues = false,
  defaultOpen = false,
}: {
  part: ToolPart
  continues?: boolean
  defaultOpen?: boolean
}) {
  const config = useThreadConfig()
  const [open, setOpen] = React.useState(defaultOpen)
  const block = useRevealOnExpand<HTMLDivElement>(open)
  const arrival = useArrival()
  const markIn = useMarkArrival()
  const tool = resolveTool(part, config.tools)
  const running = part.status === "running"
  const failed = part.status === "error"
  const stopped = part.status === "stopped"

  const asks = tool.kind === "ask"
  const registered = tool.definition.render && !failed ? tool.definition.render(tool.props) : undefined
  const builtIn = registered === undefined && !failed && !tool.definition.render ? defaultToolView(tool.kind, part, tool.props.input, tool.props.output) : undefined
  const custom = registered !== undefined ? registered : builtIn
  const hasRaw = Boolean(formatPayload(tool.props.input).trim() || formatPayload(part.output).trim() || part.error)
  const drawn = custom !== undefined ? custom !== null && custom !== false : hasRaw
  const panel = drawn
  const bare = (Boolean(tool.definition.bare) && registered !== undefined) || (builtIn !== undefined && isBareKind(tool.kind))
  const opensFile = tool.subject && config.onOpenFile && looksLikePath(tool.subject)
  /* A question is a wait on the person, not work: no stopwatch on them. */
  const timing = tool.definition.timed === false || (asks && tool.definition.timed === undefined) ? "" : took(part)
  const detail = running && asks && !part.detail ? config.labels.waitingForAnswer : tool.detail
  const Icon = tool.icon

  const label = (
    <>
      {/* Wraps rather than truncating: a long title cut at an ellipsis hides
          the half of the step the reader came for. */}
      <span className={cn("min-w-0 text-pretty break-words", running && "op-shimmer")}>
        {tool.title}
        {tool.subject && (
          <>
            {" "}
            {opensFile ? (
              <span
                className={cn("underline decoration-dotted underline-offset-2", !running && "hover:text-foreground")}
                onClick={(event) => {
                  event.stopPropagation()
                  config.onOpenFile?.(tool.subject!)
                }}
                title={tool.subject}
              >
                {basename(tool.subject)}
              </span>
            ) : (
              <span>{oneLine(tool.subject, 60)}</span>
            )}
          </>
        )}
        {!failed && detail?.trim() && <span className="ml-1.5 text-[var(--transcript-step-mark)]">{oneLine(detail)}</span>}
        {timing && <span className="ml-1.5 tabular-nums text-[var(--transcript-step-mark)]">{timing}</span>}
      </span>
      {part.diff && <DiffStat added={part.diff.added} removed={part.diff.removed} />}
      {failed && (
        <span className="shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-thread-tool font-medium text-destructive">{config.labels.failed}</span>
      )}
      {stopped && (
        <span className="shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-thread-tool font-medium text-[var(--transcript-step-mark)]">{config.labels.stopped}</span>
      )}
      {panel && <Caret open={open} />}
    </>
  )

  return (
    <Collapsible className="group/step" onOpenChange={setOpen} open={open}>
      <motion.div {...arrival} className={cn("relative -ml-1 flex min-w-0 items-start gap-1.5", continues && !open && "pb-1", open && "pb-0.5")} ref={block}>
        <div className="relative flex min-h-6 w-6 shrink-0 items-start justify-center self-stretch">
          {/* Drawn downward from under the mark, at the speed the next row
              arrives, so the line reads as being run between two steps. */}
          <motion.span
            animate={{ scaleY: 1 }}
            aria-hidden
            className={cn(RAIL, !continues && RAIL_LAST)}
            initial={config.reduced ? false : { scaleY: 0 }}
            style={{ transformOrigin: "top" }}
            transition={{ duration: config.reduced ? 0 : 0.34, ease: [0.22, 0.61, 0.36, 1], delay: config.reduced ? 0 : 0.08 }}
          />
          <motion.span className={cn(ROW_GLYPH, "text-[var(--transcript-step-mark)]")} {...markIn}>
            <MarkSwap markKey={part.status} reduced={config.reduced}>
              {running ? (
                <RunningMark icon={Icon} label={config.labels.waiting} {...(tool.definition.orb ? { orb: tool.definition.orb } : {})} />
              ) : failed ? (
                <IconAlert className={cn(MARK, "text-[var(--miss)]")} />
              ) : (
                <Icon className={Icon === IconDot ? undefined : MARK} />
              )}
            </MarkSwap>
          </motion.span>
        </div>

        <div className="min-w-0 flex-1">
          {panel ? (
            <CollapsibleTrigger className={cn(LABEL_ROW, TRIGGER)}>{label}</CollapsibleTrigger>
          ) : (
            <div className={cn(LABEL_ROW, "text-[var(--transcript-step)] transition-colors hover:text-[var(--transcript-step-strong)]")}>{label}</div>
          )}
          {panel && (
            <CollapsibleContent className={bare ? "px-0.5" : "op-block"} expandDuration={0.42} gap={6}>
              {bare ? (
                custom
              ) : (
                <div className="op-tool-detail min-w-0">
                  {failed ? (
                    <RawPayload input={tool.props.input} output={part.error ?? part.output} status={config.labels.failed} />
                  ) : custom !== undefined ? (
                    custom
                  ) : (
                    <RawPayload input={tool.props.input} output={part.output} {...(part.status === "done" ? { status: config.labels.done } : {})} {...(stopped ? { status: config.labels.stopped } : {})} />
                  )}
                </div>
              )}
            </CollapsibleContent>
          )}
        </div>
      </motion.div>
    </Collapsible>
  )
}

function basename(path: string): string {
  return path.split(/[/\\]/).filter(Boolean).at(-1) ?? path
}

/**
 * The mark of a call still under way: its own glyph, breathing. A tool whose
 * definition names an `orb` keeps the orb instead — for the one long job a
 * host wants to read as its own kind of thing.
 */
function RunningMark({ icon: Icon, label, orb }: { icon: React.ComponentType<{ className?: string }>; label: string; orb?: OrbKind }) {
  if (orb) return <Orb kind={orb} label={label} />
  return (
    <LiveMark label={label}>
      <Icon className={Icon === IconDot ? undefined : MARK} />
    </LiveMark>
  )
}

/**
 * The model's reasoning: one row, titled with what it is thinking about.
 *
 * While it streams, the title follows the section being written, so the row
 * says where the model is now; settled, that heading stays, so nothing swaps
 * under a reader mid-sentence. The thinking itself is behind the same
 * disclosure every other step uses, held to the height it streamed at.
 */
export function ReasoningStep({ part }: { part: ReasoningPart }) {
  const { labels } = useThreadConfig()
  const [open, setOpen] = React.useState(false)
  const block = useRevealOnExpand<HTMLDivElement>(open)
  const live = Boolean(part.streaming)
  const sections = thoughts(part.text)
  const prose = sections.some((section) => section.body)
  const [settling] = React.useState(live)
  const [home, setHome] = React.useState(true)
  React.useEffect(() => {
    if (live || !settling) return
    setHome(false)
    const frame = requestAnimationFrame(() => setHome(true))
    return () => cancelAnimationFrame(frame)
  }, [live, settling])

  /* A settled thought that is only headings keeps its row, as its heading:
     dropping it would make the row flash by and vanish just before the call
     it led to. */
  const titled = sections.map((section, index) => (section.title ? index : -1)).filter((index) => index >= 0).at(-1) ?? -1
  const seconds = part.startedAt ? Math.max(1, Math.round(((part.endedAt ?? Date.now()) - part.startedAt) / 1000)) : undefined
  const title = latestHeading(part.text) ?? (live ? labels.thinking : seconds ? labels.thoughtFor(seconds) : labels.thinking)
  const visible = prose ? sections : []

  /* Live, the mark stands in the gutter; settled, it goes and the words travel
     back to the prose edge — over a frame, never as a hop mid-paragraph. */
  const travel = live
    ? { marginLeft: "-0.625rem" }
    : { paddingLeft: home ? "0rem" : "1.25rem", transition: "padding-left 260ms cubic-bezier(0.32, 0.72, 0, 1)" }

  const trigger = (
    <>
      {live && (
        <span className={ROW_GLYPH}>
          <LiveMark label={labels.thinking}>
            <IconThinking className={MARK} />
          </LiveMark>
        </span>
      )}
      <span className={cn("min-w-0 truncate", live && "op-shimmer")}>{title}</span>
      {visible.length > 0 && <Caret open={open} />}
    </>
  )

  if (!visible.length) {
    return <div className={cn(ROW, live && "gap-1.5", "text-[var(--transcript-step)]")} style={travel}>{trigger}</div>
  }

  return (
    <Collapsible onOpenChange={setOpen} open={open} ref={block}>
      <CollapsibleTrigger className={cn(ROW, live && "gap-1.5", TRIGGER)} style={travel}>
        {trigger}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FadedScroll className="mx-1.5 mb-1" follow={live} watch={part.text}>
          <div className="space-y-2 border-l border-border/70 pl-2.5 text-thread leading-[1.6] text-[var(--transcript-step)]">
            {visible.map((section, index) => (
              <div key={`${part.id}-${index}`}>
                {section.title && index !== titled && <p className="font-medium text-[var(--transcript-step-strong)]">{section.title}</p>}
                {section.body && <p>{section.body}</p>}
              </div>
            ))}
          </div>
        </FadedScroll>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** A line the host said about the turn, on the thread, with its reason one click away. */
export function StatusStep({ part, continues = false }: { part: StatusPart; continues?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const warning = part.tone === "warning"
  const [head, ...rest] = part.text.split(/:\s(.*)/s)
  const reason = rest.join("").trim()
  return (
    <StepRow continues={continues} mark={warning ? <IconAlert className={cn(MARK, "text-[var(--miss)]")} /> : <IconDot />} markKey={warning ? "alert" : "dot"}>
      <button className={cn(LABEL_ROW, TRIGGER, "w-full")} onClick={() => reason && setOpen((value) => !value)} type="button">
        <span className="min-w-0 truncate">
          {head}
          {reason && !open ? <span className="ml-1.5 text-[var(--transcript-step-mark)]">{oneLine(reason, 90)}</span> : null}
        </span>
        {reason ? <Caret open={open} /> : null}
      </button>
      {open && reason ? <p className="pb-1 text-thread leading-[1.55] break-words text-[var(--transcript-step-mark)]">{reason}</p> : null}
    </StepRow>
  )
}

/** A turn that did not finish: the headline, and the detail behind a disclosure. */
export function ErrorCard({ part }: { part: ErrorPart }) {
  const { labels, reduced } = useThreadConfig()
  const [open, setOpen] = React.useState(false)
  const [headline, ...rest] = part.text.split(/(?:\.\s+|\n)/).filter((line) => line.trim().length > 0)
  const detail = rest.join(" ").trim()
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="my-0.5 min-w-0 overflow-hidden rounded-xl border border-border bg-[var(--surface-raised)] px-3 py-2.5"
      initial={reduced ? false : { opacity: 0, y: 6 }}
      role="alert"
      transition={{ duration: 0.24 }}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <IconAlert className="mt-[3px] size-4 shrink-0 text-destructive/80" />
        <div className="min-w-0 flex-1">
          <p className="text-thread font-medium text-foreground">{part.title ?? labels.turnFailed}</p>
          <p className="mt-0.5 min-w-0 break-words text-thread leading-[1.55] text-muted-foreground">
            {(headline ?? part.text).trim().replace(/\.$/, "")}.
          </p>
          {detail && (
            <>
              <button
                className="mt-1.5 inline-flex items-center gap-1 text-thread text-muted-foreground/85 transition-colors hover:text-foreground"
                onClick={() => setOpen((value) => !value)}
                type="button"
              >
                <IconChevronRight className={cn("size-3.5 transition-transform duration-200", open && "rotate-90")} />
                {open ? labels.hideDetails : labels.showDetails}
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.pre
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-1.5 overflow-x-auto rounded-lg bg-accent px-2.5 py-2 font-mono text-thread-tool leading-[1.5] whitespace-pre-wrap text-muted-foreground/90"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2, ease: [0.32, 0.72, 0, 1] }}
                  >
                    {detail}
                  </motion.pre>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Any moment of a live turn with nothing of its own on screen. Not "before the
 * first part" but "whenever nothing else is live": a turn is mostly gaps
 * between a narrated sentence and the next call, and without this a slow turn
 * is indistinguishable from a dead one.
 */
export function WaitingLine({ opening }: { opening: boolean }) {
  const { labels } = useThreadConfig()
  return (
    <div className="-mx-1 flex items-center gap-1.5 py-0.5" role="status">
      <span className={cn(ROW_GLYPH, "relative")}>
        <IconWaiting className="size-4 animate-spin text-[var(--transcript-step-mark)] [animation-duration:1.4s] motion-reduce:animate-none" />
      </span>
      <span className="op-shimmer min-w-0 truncate text-thread font-medium">{opening ? labels.connecting : labels.waiting}</span>
    </div>
  )
}

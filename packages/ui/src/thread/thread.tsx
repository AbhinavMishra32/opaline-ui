import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowDown } from "lucide-react"
import { cn } from "../lib/utils"
import { TooltipProvider } from "../components/tooltip"
import { Composer, type ComposerAttachment, type ComposerProps } from "./composer"
import { ThreadProvider, useThreadConfig, type ThreadConfig } from "./config"
import { ThreadEventsProvider, useThreadEvents, type ThreadEvents } from "./events"
import { AssistantMessage, SystemMessage } from "./messages"
import { UserMessage } from "./user-message"
import { AskUserQuestion } from "./questions"
import type { QuestionAnswer, QuestionPart, ThreadMessage } from "./types"

/* ---- Scrolling ----------------------------------------------------------------- */

type ScrollState = {
  viewport: React.RefObject<HTMLDivElement | null>
  column: React.RefObject<HTMLDivElement | null>
  pinned: boolean
  edges: { top: boolean; bottom: boolean }
  scrollToLatest: (behavior?: ScrollBehavior) => void
  /** Re-pin before paint when content changed and the reader is following. */
  stick: () => void
}

const Scroll = React.createContext<ScrollState | null>(null)

/** The thread's scroll position, for building your own jump-to-latest control. */
export function useThreadScroll(): ScrollState {
  const value = React.useContext(Scroll)
  if (!value) throw new Error("useThreadScroll must be used inside <Thread>")
  return value
}

/** Within this of the live edge counts as following it, so a reflow never unpins a stream. */
const PIN_SLACK = 48
/** How deep each edge fade runs once it is on. */
const FADE_DEPTH = "2.25rem"
/** Sub-pixel rounding lands a scroller a fraction short of its end; no fade for that. */
const FADE_SLACK = 2

/* Where each transcript was left, by `scrollKey`. Module scope: it only has to
   outlive the component, so leaving a screen and coming back lands where the
   reader was rather than wherever the first layout put them. */
const savedScroll = new Map<string, { top: number; pinned: boolean }>()

/**
 * Follow the live edge until the reader scrolls away, then stay put. Pinned
 * again on resize as well as on scroll: content grows after layout (code,
 * images) and the composer grows as a draft is typed, and neither is a scroll.
 * With a `scrollKey`, the position is restored on remount and held through
 * late layout until the reader wheels, clicks, types or touches.
 */
function useStickToBottom(scrollKey?: string): ScrollState {
  const viewport = React.useRef<HTMLDivElement | null>(null)
  const column = React.useRef<HTMLDivElement | null>(null)
  const saved = scrollKey ? savedScroll.get(scrollKey) : undefined
  const [pinned, setPinned] = React.useState(saved?.pinned ?? true)
  const [edges, setEdges] = React.useState({ top: false, bottom: false })
  const pinnedRef = React.useRef(pinned)
  pinnedRef.current = pinned
  const restoring = React.useRef<number | null>(saved && !saved.pinned ? saved.top : null)

  React.useLayoutEffect(() => {
    const node = viewport.current
    if (node && restoring.current !== null) node.scrollTop = restoring.current
  }, [])

  React.useEffect(() => {
    const node = viewport.current
    if (!node) return
    const measure = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight
      setEdges((current) => {
        const top = node.scrollTop > FADE_SLACK
        const bottom = distance > FADE_SLACK
        return current.top === top && current.bottom === bottom ? current : { top, bottom }
      })
      /* While restoring, the half-drawn layout's offset is not where the reader is. */
      if (restoring.current !== null) return
      setPinned(distance < PIN_SLACK)
      if (scrollKey) savedScroll.set(scrollKey, { top: node.scrollTop, pinned: distance < PIN_SLACK })
    }
    measure()
    node.addEventListener("scroll", measure, { passive: true })
    const observer = new ResizeObserver(() => {
      if (restoring.current !== null) node.scrollTop = restoring.current
      else if (pinnedRef.current) node.scrollTop = node.scrollHeight
      measure()
    })
    observer.observe(node)
    if (column.current) observer.observe(column.current)
    const release = () => {
      if (restoring.current === null) return
      restoring.current = null
      measure()
    }
    const intents = ["wheel", "pointerdown", "keydown", "touchstart"] as const
    for (const name of intents) node.addEventListener(name, release, { passive: true })
    return () => {
      node.removeEventListener("scroll", measure)
      for (const name of intents) node.removeEventListener(name, release)
      observer.disconnect()
    }
  }, [scrollKey])

  const scrollToLatest = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = viewport.current
    if (!node) return
    restoring.current = null
    setPinned(true)
    node.scrollTo({ top: node.scrollHeight, behavior })
  }, [])

  const stick = React.useCallback(() => {
    const node = viewport.current
    if (node && pinnedRef.current && restoring.current === null) node.scrollTop = node.scrollHeight
  }, [])

  return { viewport, column, pinned, edges, scrollToLatest, stick }
}

/* ---- Compound parts ------------------------------------------------------------ */

export type ThreadProps = ThreadConfig &
  ThreadEvents & {
    children: React.ReactNode
    className?: string
    /** Remember and restore this transcript's scroll position across remounts. */
    scrollKey?: string
  }

/**
 * The root of a thread: configuration, events and scroll state for everything
 * inside it. Compose it yourself —
 *
 *   <Thread tools={tools}>
 *     <ThreadViewport>
 *       <ThreadMessages messages={messages} />
 *     </ThreadViewport>
 *     <Composer onSubmit={send} />
 *   </Thread>
 *
 * — or reach for `<AgentThread>`, which is exactly that.
 */
export function Thread({
  children,
  className,
  scrollKey,
  onEdit,
  onRate,
  onCopy,
  renderActions,
  onAnswer,
  onCancelQuestion,
  onLoadWork,
  questionPlacement,
  ...config
}: ThreadProps) {
  const scroll = useStickToBottom(scrollKey)
  const events = React.useMemo<ThreadEvents>(
    () => ({
      ...(onEdit ? { onEdit } : {}),
      ...(onRate ? { onRate } : {}),
      ...(onCopy ? { onCopy } : {}),
      ...(renderActions ? { renderActions } : {}),
      ...(onAnswer ? { onAnswer } : {}),
      ...(onCancelQuestion ? { onCancelQuestion } : {}),
      ...(onLoadWork ? { onLoadWork } : {}),
      ...(questionPlacement ? { questionPlacement } : {}),
    }),
    [onEdit, onRate, onCopy, renderActions, onAnswer, onCancelQuestion, onLoadWork, questionPlacement],
  )
  return (
    <ThreadProvider {...config}>
      <ThreadEventsProvider value={events}>
        <Scroll.Provider value={scroll}>
          <TooltipProvider>
            <div className={cn("op-thread relative flex min-h-0 min-w-0 flex-1 flex-col", className)} data-slot="thread">
              {children}
            </div>
          </TooltipProvider>
        </Scroll.Provider>
      </ThreadEventsProvider>
    </ThreadProvider>
  )
}

/**
 * The scrolling column. Both ends dissolve while there is content past them —
 * a mask rather than a gradient, so it works over glass — and the column is
 * held to a reading width and centred.
 */
export function ThreadViewport({ children, className, empty }: { children: React.ReactNode; className?: string; empty?: boolean }) {
  const scroll = useThreadScroll()
  return (
    <div className="relative min-h-0 flex-1">
      <div
        className={cn("op-scroll op-fade-edges op-thread-scroller h-full overflow-x-hidden overflow-y-auto", className)}
        ref={scroll.viewport}
        style={
          {
            "--op-fade-top": scroll.edges.top ? FADE_DEPTH : "0px",
            "--op-fade-bottom": scroll.edges.bottom ? FADE_DEPTH : "0px",
          } as React.CSSProperties
        }
      >
        <div
          className={cn("op-thread-column relative flex min-h-full min-w-0 flex-col gap-6 pt-4", empty ? "justify-center" : "justify-start")}
          ref={scroll.column}
          role="log"
        >
          {children}
        </div>
      </div>
      <ThreadScrollButton />
    </div>
  )
}

/** Jump back to the live edge. Only there while the reader has scrolled away from it. */
export function ThreadScrollButton({ className }: { className?: string }) {
  const { pinned, scrollToLatest } = useThreadScroll()
  const { labels } = useThreadConfig()
  if (pinned) return null
  return (
    <button
      aria-label={labels.jumpToLatest}
      className={cn(
        "absolute bottom-3 left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-[var(--surface-primary)] text-muted-foreground shadow-lg ring-[0.5px] ring-[var(--border-surface-strong)] backdrop-blur-md transition hover:text-foreground",
        className,
      )}
      onClick={() => scrollToLatest()}
      title={labels.jumpToLatest}
      type="button"
    >
      <ArrowDown className="size-3.5" />
    </button>
  )
}

/**
 * Every message, each drawn by its role.
 *
 * Only what is visual is remembered here, never the messages themselves:
 *
 * - Which messages were on screen at the first render. Opening a transcript
 *   is not forty messages being sent, so those are drawn still and only what
 *   appears afterwards arrives.
 * - What the last committed list was, for the optimistic hand-off. A host
 *   usually shows a user message the instant it is sent and swaps in the
 *   stored copy (under a new id) a moment later. Both are the same words said
 *   once, so the stored copy inherits the arrival the first already played.
 *
 * A streaming assistant message that leaves the list dissolves rather than
 * vanishing (`popLayout`): when a host replaces the live turn with the stored
 * one, the two draw the same rows in the same place and cross over each other,
 * so the only thing the reader sees at the end of a turn is the shimmer
 * stopping.
 *
 * While a turn is running, user messages cannot be edited: rewinding under a
 * turn that is still writing would cut the transcript out from beneath it.
 */
export function ThreadMessages({ messages }: { messages: ThreadMessage[] }) {
  const scroll = React.useContext(Scroll)
  /* Pinned before paint, so a new row never shows a frame short of the edge. */
  React.useLayoutEffect(() => scroll?.stick(), [messages, scroll])

  const seen = React.useRef<Set<string> | null>(null)
  if (seen.current === null) seen.current = new Set(messages.map((message) => message.id))
  const committed = React.useRef<ThreadMessage[]>(messages)
  React.useEffect(() => {
    for (const message of messages) seen.current!.add(message.id)
    committed.current = messages
  })

  const handedOff = textsReplacedSince(committed.current, messages)
  const busy = isTurnRunning(messages)
  const latest = messages.findLast((message) => message.role === "assistant")

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {messages.map((message) => {
        if (message.role === "user") {
          const isNew = !seen.current!.has(message.id)
          const arriving = isNew && !handedOff.has(message.text.trim())
          return <UserMessage arriving={arriving} editable={!busy} key={message.id} message={message} />
        }
        if (message.role === "system") return <SystemMessage key={message.id} message={message} />
        return (
          <LeavingTurn key={message.id} live={message.status === "streaming"}>
            <AssistantMessage latest={message.id === latest?.id} message={message} />
          </LeavingTurn>
        )
      })}
    </AnimatePresence>
  )
}

/** How long a live turn takes to dissolve when the host takes it away. */
const LIVE_TURN_EXIT_S = 0.22

/**
 * The box an assistant message is drawn in, so it can leave. A live turn
 * fades as it goes (the stored turn replacing it is drawn underneath); a
 * settled one is simply removed — an edit rewinding the conversation should
 * not leave ghosts behind.
 */
const LeavingTurn = React.forwardRef<HTMLDivElement, { live: boolean; children: React.ReactNode }>(function LeavingTurn({ live, children }, ref) {
  const exit = live ? { opacity: 0, transition: { duration: LIVE_TURN_EXIT_S, ease: "linear" as const } } : { opacity: 0, transition: { duration: 0 } }
  return (
    <motion.div className="min-w-0" exit={exit} ref={ref}>
      {children}
    </motion.div>
  )
})

/** Whether the last assistant message is still streaming. */
function isTurnRunning(messages: readonly ThreadMessage[]): boolean {
  const last = messages.findLast((message) => message.role === "assistant")
  if (!last || last.role !== "assistant") return false
  return last.status === "streaming"
}

/**
 * The words of user messages that were on screen last time and are gone now —
 * an optimistic message the host has just replaced with its stored copy.
 */
export function textsReplacedSince(previous: readonly ThreadMessage[], current: readonly ThreadMessage[]): Set<string> {
  const currentIds = new Set<string>()
  for (const message of current) currentIds.add(message.id)
  const texts = new Set<string>()
  for (const message of previous) {
    if (message.role !== "user") continue
    if (currentIds.has(message.id)) continue
    texts.add(message.text.trim())
  }
  return texts
}

/* ---- Batteries included --------------------------------------------------------- */

export type AgentThreadProps = Omit<ThreadProps, "children"> & {
  messages: ThreadMessage[]
  /**
   * Called with the draft and its ready attachments when the person sends.
   * Omit to hide the composer. `(text) => …` still works.
   */
  onSend?: (text: string, attachments: ComposerAttachment[]) => void
  /** Stop a running turn. Shown while the last turn is streaming. */
  onStop?: () => void
  /** Images on the draft. Controlled: add on `onAttach`, clear after `onSend`. */
  attachments?: ComposerAttachment[]
  /** Files picked, pasted or dropped onto the composer. Shows the attach button. */
  onAttach?: (files: File[]) => void
  onRemoveAttachment?: (id: string) => void
  /** Everything else the composer takes. */
  composer?: Omit<ComposerProps, "onSubmit" | "onStop" | "busy">
  /** Above the first message: a title, a context card. */
  header?: React.ReactNode
  /** Shown centred when there are no messages. */
  empty?: React.ReactNode
  /** After the last message. */
  footer?: React.ReactNode
}

/** The newest question still waiting on the person, if any. */
export function pendingQuestion(messages: readonly ThreadMessage[]): QuestionPart | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    if (message?.role !== "assistant") continue
    const part = message.parts.findLast((item): item is QuestionPart => item.type === "question" && item.status === "pending")
    if (part) return part
  }
  return undefined
}

/**
 * The whole thread in one component: the transcript, the scroller, and the
 * composer, wired together. A pending question takes the composer's place
 * (`questionPlacement="composer"`, the default) until it is answered.
 *
 *   <AgentThread messages={messages} onSend={send} onStop={stop} onAnswer={answer} tools={tools} />
 */
export function AgentThread({
  messages,
  onSend,
  onStop,
  attachments,
  onAttach,
  onRemoveAttachment,
  composer,
  header,
  empty,
  footer,
  className,
  questionPlacement = "composer",
  ...props
}: AgentThreadProps) {
  const last = messages.at(-1)
  const busy = last?.role === "assistant" && last.status === "streaming"
  const isEmpty = messages.length === 0
  return (
    <Thread className={className} questionPlacement={questionPlacement} {...props}>
      <ThreadViewport empty={isEmpty && Boolean(empty)}>
        {header}
        {isEmpty ? empty : <ThreadMessages messages={messages} />}
        {footer}
      </ThreadViewport>
      <AgentInput
        busy={busy}
        composer={{
          ...(attachments ? { attachments } : {}),
          ...(onAttach ? { onAttach } : {}),
          ...(onRemoveAttachment ? { onRemoveAttachment } : {}),
          ...composer,
        }}
        question={questionPlacement === "composer" ? pendingQuestion(messages) : undefined}
        {...(onSend ? { onSend } : {})}
        {...(onStop ? { onStop } : {})}
      />
    </Thread>
  )
}

/** The composer, or the question standing in its place. */
function AgentInput({
  busy,
  question,
  onSend,
  onStop,
  composer,
}: {
  busy: boolean
  question: QuestionPart | undefined
  onSend?: AgentThreadProps["onSend"]
  onStop?: () => void
  composer: AgentThreadProps["composer"]
}) {
  const events = useThreadEvents()
  const { reduced } = useThreadConfig()
  const [sending, setSending] = React.useState(false)
  const [focus, setFocus] = React.useState(0)
  const asking = question && events.onAnswer ? question : undefined

  React.useEffect(() => setSending(false), [asking?.id])

  const answer = (answers: QuestionAnswer[]) => {
    if (!asking || !events.onAnswer) return
    const result = events.onAnswer(asking.id, answers)
    if (result && typeof (result as Promise<void>).then === "function") {
      setSending(true)
      void (result as Promise<void>).finally(() => {
        setSending(false)
        setFocus((value) => value + 1)
      })
    } else setFocus((value) => value + 1)
  }

  if (!onSend && !asking) return null
  const swap = reduced ? { duration: 0 } : { duration: 0.18 }
  return (
    <div className="shrink-0 px-4 pb-3">
      <AnimatePresence initial={false} mode="wait">
        {asking ? (
          <motion.div animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} initial={reduced ? false : { opacity: 0, y: 6 }} key={`question-${asking.id}`} transition={swap}>
            <AskUserQuestion
              busy={sending}
              onSubmit={answer}
              questions={asking.questions}
              {...(events.onCancelQuestion ? { onCancel: () => events.onCancelQuestion?.(asking.id) } : {})}
            />
          </motion.div>
        ) : onSend ? (
          <motion.div animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} initial={reduced ? false : { opacity: 0, y: 6 }} key="composer" transition={swap}>
            <Composer busy={busy} focusRequest={focus} onSubmit={onSend} {...(onStop ? { onStop } : {})} {...composer} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

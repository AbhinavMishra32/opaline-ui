/**
 * An agent's turn, drawn: the work folded under "Worked for…", the turn's
 * outcomes, then the reply with its footer (copy, rating, time).
 *
 * `AssistantMessage` is what `ThreadMessages` draws for every assistant
 * message; `MessageParts` draws any run of parts on its own, for hosts that
 * compose a turn themselves. Everything here renders the message it is given
 * and reports actions through `ThreadEvents` — the same component draws a turn
 * live and read back from storage, so a turn looks the same after it lands.
 */
import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react"
import { cn } from "../lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip"
import { useThreadConfig } from "./config"
import { useThreadEvents, type ThreadEvents } from "./events"
import { WorkFold } from "./fold"
import { groupParts, isOutcome, type PartRow } from "./group"
import { Markdown } from "./markdown"
import { MESSAGE_ACTION_ROW, MessageAction, MessageActionButton } from "./MessageActions"
import { formatQuestionAnswers, questionExchange } from "./question-exchange"
import { QuestionCard } from "./questions"
import { ReferenceCards } from "./references"
import { CARD_GAP, ErrorCard, FINAL_GAP, PROSE_GAP, ReasoningStep, StatusStep, StepRow, ToolStep, WaitingLine } from "./steps"
import { Exchanges } from "./tool-views"
import { IconDot } from "./threadIcons"
import { clockTime } from "./user-message"
import type { AssistantMessage as AssistantMessageData, MessagePart, QuestionPart, ToolPart } from "./types"

export { SystemMessage } from "./system"
export { UserMessage, AttachmentThumbnail, clockTime } from "./user-message"
export { ThreadEventsProvider, useThreadEvents, type ThreadEvents } from "./events"

/* ---- Turn anatomy ------------------------------------------------------------ */

/**
 * Where the work ends and the reply begins. Explicit when the host says so
 * (`replyFrom`); otherwise the trailing run of text — the agent narrating
 * between calls is work, and only what it says after its last call is the
 * answer.
 */
export function splitTurn(message: AssistantMessageData): { work: MessagePart[]; reply: MessagePart[] } {
  const { parts } = message
  let from = message.replyFrom
  if (from === undefined) {
    // Agents often answer, then record something: a settled step or a result card after the
    // last words. Once the turn is over, those ride with the reply instead of hiding it in the fold.
    let end = parts.length
    if (message.status !== "streaming") while (end > 0 && settlesAfterReply(parts[end - 1]!)) end -= 1
    from = end
    while (from > 0 && parts[from - 1]!.type === "text") from -= 1
    if (from === end) from = parts.length
    if (from === 0 && parts.length > 0) return { work: [], reply: parts }
  }
  return { work: parts.slice(0, from), reply: parts.slice(from) }
}

/** A part that may follow the reply's text without reopening the work: a finished step, a card. */
function settlesAfterReply(part: MessagePart): boolean {
  if (part.type === "tool") return part.status !== "running"
  if (part.type === "custom") return !part.inline
  return false
}

/** A question part drawn as the ask-the-user row it stands for, so it sits on the thread with the other steps. */
export function questionAsTool(part: QuestionPart, cancelled = "Not answered"): ToolPart {
  return {
    type: "tool",
    id: part.id,
    name: "ask_user",
    status: part.status === "pending" ? "running" : "done",
    input: { questions: part.questions },
    ...(part.status === "answered" ? { output: formatQuestionAnswers(part.questions, part.answers ?? []) } : {}),
    ...(part.status === "cancelled" ? { detail: cancelled } : {}),
  }
}

function inlineQuestion(part: MessagePart | undefined, events: ThreadEvents): boolean {
  return part?.type === "question" && part.status === "pending" && events.questionPlacement === "inline" && Boolean(events.onAnswer)
}

function onGutter(part: MessagePart | undefined, events: ThreadEvents): boolean {
  if (part?.type === "question") return !inlineQuestion(part, events)
  return part?.type === "tool" || part?.type === "status" || (part?.type === "custom" && part.inline === true)
}

function isCard(part: MessagePart | undefined, events: ThreadEvents): boolean {
  return part?.type === "error" || (part?.type === "custom" && !part.inline) || inlineQuestion(part, events)
}

/**
 * Every row of a turn in the order it happened, grouped (`groupParts`):
 * a thought is its own row, before the call it led to. Spacing is per row:
 * steps in one run of work sit touching so the rail can run through them,
 * prose claims its room from both sides, and cards get theirs once.
 */
export function MessageParts({ parts, streaming = false }: { parts: MessagePart[]; streaming?: boolean }) {
  const events = useThreadEvents()
  const rows = React.useMemo(() => groupParts(parts), [parts])
  return (
    <>
      {rows.map((row, index) => {
        const { part } = row
        const previous = rows[index - 1]?.part
        const linked = onGutter(part, events) && onGutter(previous, events)
        const continues = onGutter(part, events) && onGutter(rows[index + 1]?.part, events)
        const prose = part.type === "text" || previous?.type === "text"
        const gap = index === 0 || linked ? undefined : prose ? PROSE_GAP : isCard(part, events) || isCard(previous, events) ? CARD_GAP : undefined
        const last = index === rows.length - 1
        return (
          <div className="min-w-0" key={part.id} {...(gap ? { style: { marginTop: gap } } : {})}>
            <PartView continues={continues} last={last} row={row} streaming={streaming} />
          </div>
        )
      })}
    </>
  )
}

/** One grouped row of a turn, drawn by its part's type. */
function PartView({ row, continues, last, streaming: live }: { row: PartRow; continues: boolean; last: boolean; streaming: boolean }) {
  const config = useThreadConfig()
  const events = useThreadEvents()
  const { part } = row
  switch (part.type) {
    case "text":
      return config.renderMarkdown ? config.renderMarkdown(part.text, { streaming: live && last }) : <Markdown source={part.text} streaming={live && last} />
    case "reasoning":
      return <ReasoningStep part={part} />
    case "tool":
      return <ToolStep continues={continues} part={part} />
    case "question":
      if (inlineQuestion(part, events)) {
        return <QuestionCard interactive part={part} {...(events.onAnswer ? { onAnswer: events.onAnswer } : {})} {...(events.onCancelQuestion ? { onCancel: events.onCancelQuestion } : {})} />
      }
      return <ToolStep continues={continues} part={questionAsTool(part, config.labels.questionCancelled)} />
    case "status":
      return <StatusStep continues={continues} part={part} />
    case "error":
      return <ErrorCard part={part} />
    case "custom": {
      const drawn = config.renderPart?.(part) ?? null
      return part.inline ? (
        <StepRow continues={continues} mark={<IconDot />} markKey="custom">
          {drawn}
        </StepRow>
      ) : (
        <>{drawn}</>
      )
    }
  }
}

/**
 * The turn's outcomes — answered questions — drawn as cards below the fold,
 * where they stay in view once the work folds away.
 */
export function Outcomes({ parts }: { parts: MessagePart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        const exchanges = part.type === "question" ? null : part.type === "tool" ? questionExchange(part.input, part.output) : []
        return (
          <div className="min-w-0" key={part.id} style={index > 0 ? { marginTop: CARD_GAP } : undefined}>
            {part.type === "question" ? <QuestionCard part={part} /> : exchanges && exchanges.length > 0 ? <Exchanges exchanges={exchanges} /> : null}
          </div>
        )
      })}
    </>
  )
}

/** How long the fold takes to shut itself when the reply starts; the reply waits for it. */
const FOLD_CLOSE_MS = 900

/**
 * The end of the work and the start of the answer are two events, and drawn at
 * once they blur. So the fold collapses into "Worked for" first, and only then
 * does the reply start writing.
 */
function useReplyReady(replyStartedAt: number | undefined, folds: boolean, live: boolean): boolean {
  const { reduced } = useThreadConfig()
  const wait = folds && live && !reduced
  const [ready, setReady] = React.useState(!wait || replyStartedAt !== undefined && Date.now() - replyStartedAt > FOLD_CLOSE_MS)
  React.useEffect(() => {
    if (!wait) {
      setReady(true)
      return
    }
    if (replyStartedAt === undefined) {
      setReady(false)
      return
    }
    const timer = window.setTimeout(() => setReady(true), Math.max(0, replyStartedAt + FOLD_CLOSE_MS - Date.now()))
    return () => window.clearTimeout(timer)
  }, [replyStartedAt, wait])
  return ready
}

function isLive(part: MessagePart): boolean {
  return (
    (part.type === "tool" && part.status === "running") ||
    (part.type === "reasoning" && Boolean(part.streaming)) ||
    (part.type === "question" && part.status === "pending")
  )
}

/**
 * An agent's turn: the work, folded, then the answer.
 *
 * The same component draws a turn live and read back from storage, so a turn
 * looks the same after it lands as it did while it ran.
 */
export const AssistantMessage = React.memo(function AssistantMessage({ message, latest = false }: { message: AssistantMessageData; latest?: boolean }) {
  const config = useThreadConfig()
  const events = useThreadEvents()
  const live = message.status === "streaming"
  const { work, reply } = splitTurn(message)
  const outcomes = config.fold === "none" ? [] : work.filter(isOutcome)
  const deferred = (message.deferredSteps ?? 0) > 0 && Boolean(events.onLoadWork)
  const replyText = reply.filter((part) => part.type === "text").map((part) => part.text).join("\n\n")

  /* The reply's start, observed when the host does not report it. */
  const observed = React.useRef<number | undefined>(undefined)
  if (live && reply.length > 0 && observed.current === undefined) observed.current = Date.now()
  if (live && reply.length === 0) observed.current = undefined
  const replyStartedAt = message.replyStartedAt ?? (live ? observed.current : undefined)

  const waiting = live && replyStartedAt === undefined && !work.some(isLive)
  const shows = waiting || work.length > 0 || deferred
  const ready = useReplyReady(replyStartedAt, work.length > 0 && config.fold !== "none", live)
  const arrival = live && !config.reduced ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring" as const, visualDuration: 0.45, bounce: 0 } } : {}

  const steps = (
    <>
      <MessageParts parts={work} streaming={live} />
      {/* Whenever nothing else is live: a turn is mostly gaps between a
          sentence and the next call, and a slow turn must not look dead. */}
      <AnimatePresence initial={false} mode="popLayout">
        {waiting && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={config.reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
            initial={config.reduced ? false : { opacity: 0, y: 6 }}
            key="waiting"
            transition={config.reduced ? { duration: 0 } : { type: "spring", visualDuration: 0.35, bounce: 0 }}
          >
            <WaitingLine opening={message.parts.length === 0} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  return (
    <motion.div className="group/reply min-w-0" data-role="assistant" {...arrival}>
      {shows &&
        (config.fold === "none" ? (
          steps
        ) : (
          <WorkFold
            connected={work.length > 0 || replyStartedAt !== undefined}
            live={live}
            mode={config.fold ?? "auto"}
            {...(deferred ? { bodyLoaded: false, onOpen: () => events.onLoadWork?.(message.id) } : {})}
            {...(message.startedAt !== undefined ? { startedAt: message.startedAt } : {})}
            {...(replyStartedAt !== undefined ? { replyStartedAt } : {})}
            {...(message.durationMs !== undefined ? { durationMs: message.durationMs } : {})}
          >
            {steps}
          </WorkFold>
        ))}
      {outcomes.length > 0 && (
        <div className="min-w-0" style={{ marginTop: PROSE_GAP }}>
          <Outcomes parts={outcomes} />
        </div>
      )}
      {ready && reply.length > 0 && (
        <div className="min-w-0 pb-2" style={shows ? { marginTop: FINAL_GAP } : undefined}>
          <MessageParts parts={reply} streaming={live} />
          {!live && replyText.trim() && <ReferenceCards source={replyText} />}
          {!live && replyText.trim() && <ReplyFooter latest={latest} message={message} text={replyText} />}
        </div>
      )}
    </motion.div>
  )
})

/**
 * Actions belong to the answer, never to the work. The newest reply keeps them
 * on screen; older ones show them on hover, which suits a transcript being
 * scrolled back through. A rated reply keeps its footer — the verdict is part
 * of what the message now says.
 */
function ReplyFooter({ message, text, latest }: { message: AssistantMessageData; text: string; latest: boolean }) {
  const { labels } = useThreadConfig()
  const events = useThreadEvents()
  const [copied, setCopied] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  /* The verdict is the message's own: the thread keeps no copy of it. A host
     that wants the thumb lit on the click updates `rating` in the same tick. */
  const verdict = message.rating ?? null
  React.useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = () => {
    if (events.onCopy) {
      events.onCopy(text, message.id)
      setFailed(false)
      setCopied(true)
      return
    }
    const write = navigator.clipboard?.writeText(text)
    if (!write) return setFailed(true)
    void write.then(
      () => {
        setFailed(false)
        setCopied(true)
      },
      () => setFailed(true),
    )
  }
  /* Clicking the lit verdict takes it back: a judgement you cannot withdraw is one people stop making. */
  const rate = (next: "good" | "bad") => {
    const value = verdict === next ? null : next
    events.onRate?.(message.id, value)
  }
  const held = latest || verdict !== null

  return (
    <div className={cn(MESSAGE_ACTION_ROW, "mt-4 transition-opacity focus-within:opacity-100 group-hover/reply:opacity-100", held ? "opacity-100" : "opacity-0")}>
      <MessageAction label={failed ? labels.copyFailed : copied ? labels.copied : labels.copy} onClick={copy}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      </MessageAction>
      {events.onRate && (
        <DropdownMenu>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <MessageActionButton active={verdict !== null} aria-label={labels.rate}>
                  {verdict === "bad" ? <ThumbsDown aria-hidden /> : <ThumbsUp aria-hidden />}
                </MessageActionButton>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{verdict ? labels.rated(verdict === "good" ? labels.rateGood : labels.rateBad) : labels.rate}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="min-w-[10rem]">
            {(["good", "bad"] as const).map((value) => {
              const Icon = value === "good" ? ThumbsUp : ThumbsDown
              return (
                <DropdownMenuItem className={cn(verdict === value && "text-foreground [&_svg]:fill-current")} key={value} onSelect={() => rate(value)}>
                  <Icon aria-hidden />
                  {value === "good" ? labels.rateGood : labels.rateBad}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {events.renderActions?.(message)}
      {message.createdAt !== undefined && (
        <time className="ml-1.5 opacity-0 transition-opacity group-hover/reply:opacity-100" dateTime={new Date(message.createdAt).toISOString()}>
          {clockTime(message.createdAt)}
        </time>
      )}
    </div>
  )
}

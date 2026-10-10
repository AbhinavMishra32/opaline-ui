/**
 * What the person said: their bubble, the images they sent with it, and the
 * controls under it (time, copy, edit-and-run-again).
 *
 * Part of the thread kit's message rendering — `ThreadMessages` draws one of
 * these for every `role: "user"` message. Like every thread component it only
 * renders the message it is given; an edit is reported through `onEdit` and
 * the host decides what happens to the conversation.
 */
import * as React from "react"
import { motion } from "motion/react"
import { Check, Copy, Pencil } from "lucide-react"
import { cn } from "../lib/utils"
import { Dialog, DialogContent, DialogTitle } from "../components/dialog"
import { useThreadConfig } from "./config"
import { MESSAGE_ACTION_ROW, MessageAction } from "./MessageActions"
import { useThreadEvents } from "./messages"
import { ReferenceLink, parseReference, REFERENCE_PATTERN } from "./references"
import type { Attachment, UserMessage as UserMessageData } from "./types"

/** How long "Copied" stays on the copy button. */
const COPIED_MS = 1500

/** How often the hovered bubble's "4 min ago" is refreshed. */
const RELATIVE_TIME_REFRESH_MS = 30_000

/**
 * One user message.
 *
 * It arrives from the composer — up a few pixels, off the corner nearest the
 * field it was typed in — so watching the words travel into the transcript is
 * the whole confirmation a send needs. `arriving` is false for messages that
 * were already there when the thread mounted, and for a durable message that
 * replaces an optimistic one the reader already watched arrive.
 *
 * `editable` turns on edit-and-run-again. The thread turns it off while a turn
 * is running: rewinding the conversation under a turn that is still writing
 * into it would cut the transcript out from beneath the agent.
 */
export const UserMessage = React.memo(function UserMessage({
  message,
  arriving = false,
  editable = true,
}: {
  message: UserMessageData
  arriving?: boolean
  editable?: boolean
}) {
  const { labels, reduced } = useThreadConfig()
  const events = useThreadEvents()
  const [editing, setEditing] = React.useState(false)
  const [hovering, setHovering] = React.useState(false)
  const canEdit = editable && Boolean(events.onEdit) && !message.pending

  if (editing) {
    return (
      <EditBubble
        onCancel={() => setEditing(false)}
        onSubmit={(text) => {
          setEditing(false)
          events.onEdit?.(message.id, text)
        }}
        text={message.text}
      />
    )
  }

  const images = message.attachments ?? []
  const hasText = message.text.trim().length > 0
  const opacity = message.pending ? 0.6 : 1
  const arrival = {
    initial: arriving && !reduced ? { opacity: 0, y: 14, scale: 0.94 } : (false as const),
    style: { transformOrigin: "bottom right" },
    transition: { opacity: { duration: 0.2 }, default: { type: "spring" as const, visualDuration: 0.42, bounce: 0.2 } },
  }

  return (
    <div
      className="group/said relative flex min-w-0 flex-col items-end gap-1.5"
      data-role="user"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {images.length > 0 && (
        <motion.div animate={{ opacity, y: 0, scale: 1 }} className="flex max-w-[80%] flex-wrap justify-end gap-1.5" {...arrival}>
          {images.map((image) => (
            <AttachmentThumbnail image={image} key={image.id} single={images.length === 1 && !hasText} />
          ))}
        </motion.div>
      )}
      {hasText && (
        <motion.div
          animate={{ opacity, y: 0, scale: 1 }}
          className="op-bubble max-w-[min(fit-content,80%)] min-w-0 px-3 py-2 text-thread break-words whitespace-pre-wrap"
          {...arrival}
          {...(message.pending ? { title: labels.pending } : {})}
        >
          <UserText text={message.text} />
        </motion.div>
      )}
      <div
        className={cn(
          MESSAGE_ACTION_ROW,
          "absolute -bottom-6 right-0 justify-end pr-1 opacity-0 transition-opacity group-hover/said:opacity-100 focus-within:opacity-100",
        )}
      >
        {message.createdAt !== undefined && <SentTime createdAt={message.createdAt} hovering={hovering} />}
        <CopyAction messageId={message.id} text={message.text} />
        {canEdit && (
          <MessageAction label={labels.edit} onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
          </MessageAction>
        )}
      </div>
    </div>
  )
})

/**
 * "4 min ago", with the clock time on hover. Only ticks while the bubble is
 * hovered — the only time it is visible — so a long transcript is not a
 * timer per message.
 */
function SentTime({ createdAt, hovering }: { createdAt: string | number; hovering: boolean }) {
  const { labels } = useThreadConfig()
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    if (!hovering) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), RELATIVE_TIME_REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [hovering])

  const sentAt = new Date(createdAt).getTime()
  if (!Number.isFinite(sentAt)) return null
  const elapsed = Math.max(0, now - sentAt)
  return (
    <time className="mr-1.5" dateTime={new Date(sentAt).toISOString()} title={clockTime(createdAt)}>
      {labels.relativeTime(elapsed)}
    </time>
  )
}

/** Copy the message's text: through `onCopy` when the host handles it, the clipboard otherwise. */
function CopyAction({ text, messageId }: { text: string; messageId: string }) {
  const { labels } = useThreadConfig()
  const events = useThreadEvents()
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    if (events.onCopy) {
      events.onCopy(text, messageId)
      setCopied(true)
      return
    }
    try {
      await navigator.clipboard?.writeText(text)
      setCopied(true)
    } catch {
      /* Nothing to say on the bubble: the button simply does not flash. */
    }
  }

  return (
    <MessageAction label={copied ? labels.copied : labels.copy} onClick={() => void copy()}>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </MessageAction>
  )
}

/**
 * The bubble, rewritten in place. Return sends again, Escape gives up. The
 * draft is the only state here, and it starts from the message's own text
 * every time the editor opens.
 */
function EditBubble({ text, onSubmit, onCancel }: { text: string; onSubmit: (text: string) => void; onCancel: () => void }) {
  const { labels } = useThreadConfig()
  const [draft, setDraft] = React.useState(text)
  const trimmed = draft.trim()

  const submit = () => {
    if (!trimmed) return
    onSubmit(trimmed)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      onCancel()
      return
    }
    const sends = event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing
    if (sends) {
      event.preventDefault()
      submit()
    }
  }

  const rows = Math.min(6, draft.split("\n").length)

  return (
    <div className="flex min-w-0 justify-end" data-role="user">
      <div className="op-bubble w-[90%] min-w-0 px-3 py-2.5">
        <textarea
          autoFocus
          className="op-scroll block max-h-40 w-full resize-none bg-transparent py-0.5 text-thread leading-[1.55] outline-none"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          rows={rows}
          value={draft}
        />
        <div className="mt-2 flex items-center justify-end gap-1.5">
          <button
            className="h-7 rounded-lg bg-background px-2.5 text-thread text-foreground shadow-sm ring-[0.5px] ring-[var(--border-surface-strong)] transition-colors hover:bg-accent"
            onClick={onCancel}
            type="button"
          >
            {labels.cancel}
          </button>
          <button
            className="op-press h-7 rounded-lg bg-foreground px-2.5 text-thread font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={!trimmed}
            onClick={submit}
            type="button"
          >
            {labels.resend}
          </button>
        </div>
      </div>
    </div>
  )
}

/** A time of day the way the reader's locale writes it: "3:41 PM". */
export function clockTime(value: string | number): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
}

const REFERENCES = new RegExp(REFERENCE_PATTERN.source, "g")

/**
 * What the person typed: plain text, not markdown — their asterisks are
 * theirs. The one exception is `[[kind:target|label]]` references, which the
 * composer wrote on their behalf and which are drawn live.
 */
function UserText({ text }: { text: string }) {
  if (!text.includes("[[")) return <>{text}</>
  const nodes: React.ReactNode[] = []
  let cursor = 0
  for (const match of text.matchAll(REFERENCES)) {
    const index = match.index ?? 0
    const reference = parseReference(match[0])
    if (!reference) continue
    if (index > cursor) nodes.push(text.slice(cursor, index))
    nodes.push(<ReferenceLink key={index} {...reference} />)
    cursor = index + match[0].length
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return <>{nodes}</>
}

/** An image the person sent: a thumbnail that opens full size in a dialog. */
export function AttachmentThumbnail({ image, single = false, className }: { image: Attachment; single?: boolean; className?: string }) {
  const { labels } = useThreadConfig()
  const [open, setOpen] = React.useState(false)
  const name = image.name ?? "image"
  return (
    <>
      <button
        aria-label={labels.viewImage(name)}
        className={cn(
          "op-press block shrink-0 overflow-hidden rounded-xl bg-muted ring-[0.5px] ring-[var(--border-surface-strong)] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
          single ? "max-h-64 max-w-64" : "size-20",
          className,
        )}
        onClick={() => setOpen(true)}
        title={name}
        type="button"
      >
        <img
          alt={name}
          className={cn("block", single ? "h-auto max-h-64 w-auto max-w-64 object-contain" : "size-full object-cover")}
          decoding="async"
          loading="lazy"
          src={image.url}
          {...(image.width ? { width: image.width } : {})}
          {...(image.height ? { height: image.height } : {})}
        />
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="w-auto max-w-[min(92vw,64rem)] p-2 sm:max-w-[min(92vw,64rem)]">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <img alt={name} className="block max-h-[82vh] w-auto max-w-full rounded-lg object-contain" decoding="async" src={image.url} />
        </DialogContent>
      </Dialog>
    </>
  )
}

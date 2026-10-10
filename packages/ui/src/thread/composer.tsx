import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertCircle, ArrowUp, ChevronDown, ImagePlus, Loader2, Plus, Square, X } from "lucide-react"
import { cn } from "../lib/utils"
import { useThreadConfig } from "./config"
import { expandMentions, mentionRange, mentionToken, type MentionItem } from "./mention-text"
import { MentionPicker, MentionTags } from "./mentions"
import type { Attachment } from "./types"

/** An image on its way into a message. `status` defaults to `"ready"`. */
export type ComposerAttachment = Attachment & {
  status?: "uploading" | "ready" | "error"
  /** 0–1 while uploading, for a determinate ring. */
  progress?: number
  /** Why an upload failed, for the chip's tooltip. */
  error?: string
}

export type ComposerProps = {
  /** Controlled draft. Leave both `value` and `onValueChange` out to let the composer hold it. */
  value?: string
  onValueChange?: (value: string) => void
  /**
   * Called with the trimmed draft and the ready attachments. The composer
   * clears its draft afterwards; attachments are the host's to clear.
   */
  onSubmit?: (text: string, attachments: ComposerAttachment[]) => void
  /** A turn is running: shows Stop when `onStop` is given and nothing is drafted. */
  busy?: boolean
  onStop?: () => void
  /** Let the person send while a turn runs (steering). Default true. */
  steerable?: boolean
  /** The draft must be at least this long to send. Default 1. */
  minLength?: number
  /** Bump to move focus into the field — after a question is answered, say. */
  focusRequest?: number
  /** Images attached to the draft, drawn as chips above the field. Controlled. */
  attachments?: ComposerAttachment[]
  /**
   * Files the person picked, pasted or dropped, filtered by `accept`. Upload
   * them and add them to `attachments`. Giving this shows the attach button.
   */
  onAttach?: (files: File[]) => void
  /** Open your own picker instead of the file dialog when + is clicked. */
  onAttachClick?: () => void
  onRemoveAttachment?: (id: string) => void
  /** Which files `onAttach` takes. Default `"image/*"`. */
  accept?: string
  /** Let the file dialog take several files. Default true. */
  multiple?: boolean
  /**
   * A condition of the input, inside the shell above the field — "No model
   * connected". It stays until it is fixed; pair it with `ready={false}`.
   */
  notice?: React.ReactNode
  /** False blocks sending and hides the hint. Default true. */
  ready?: boolean
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  /** Rows above the field inside the shell: a context chip, a banner. */
  header?: React.ReactNode
  /** Controls in the row under the shell, before the hint: a model picker. */
  leading?: React.ReactNode
  /** Controls in that row, right before Send. */
  trailing?: React.ReactNode
  /** The quiet line in that row. Defaults to the steering hint while busy. */
  hint?: React.ReactNode
  /** Maximum height of the field before it scrolls, in px. Default 176. */
  maxHeight?: number
  /**
   * What `@` can mention. Typing `@` opens a picker over these; a pick puts
   * `@label` in the draft, drawn as a tag, and `onSubmit` receives it as
   * `[[kind:id|label]]`. Omit to leave `@` as a plain character.
   */
  mentions?: MentionItem[]
  className?: string
}

/** Keys the `@` picker handles while it is open; the field leaves them alone. */
const PICKER_KEYS = new Set(["Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Escape"])

/** Whether a file matches an `accept` string: `image/*`, `.png`, `image/png`. */
export function acceptsFile(file: File, accept: string): boolean {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean)
  if (rules.length === 0) return true
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return rules.some((rule) =>
    rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule,
  )
}

/**
 * The field a conversation is typed into.
 *
 * One glass shell; focus reads as the surface lifting rather than a coloured
 * ring. Return sends and Shift-Return breaks a line. While a turn runs a typed
 * draft keeps the send button (steering) and Stop comes back once the field is
 * empty. Images arrive by the + button, by paste, or dropped on the shell.
 */
export function Composer({
  value: controlled,
  onValueChange,
  onSubmit,
  busy = false,
  onStop,
  steerable = true,
  minLength = 1,
  focusRequest = 0,
  attachments = [],
  onAttach,
  onAttachClick,
  onRemoveAttachment,
  accept = "image/*",
  multiple = true,
  notice,
  ready = true,
  placeholder,
  disabled = false,
  autoFocus = false,
  header,
  leading,
  trailing,
  hint,
  maxHeight = 176,
  mentions,
  className,
}: ComposerProps) {
  const { labels, reduced } = useThreadConfig()
  const [internal, setInternal] = React.useState("")
  const value = controlled ?? internal
  const setValue = (next: string) => {
    if (controlled === undefined) setInternal(next)
    onValueChange?.(next)
  }
  const [sent, setSent] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const field = React.useRef<HTMLTextAreaElement>(null)
  const picker = React.useRef<HTMLInputElement>(null)
  const tagLayer = React.useRef<HTMLDivElement>(null)
  /* The `@` being completed, read from the field rather than remembered: the
     caret can leave a mention without the text changing. */
  const [mention, setMention] = React.useState<{ start: number; query: string } | null>(null)
  /* Mentions picked into this draft: the word in the field → the markup it is sent as. */
  const [picked, setPicked] = React.useState<ReadonlyMap<string, string>>(() => new Map())
  const pickedTokens = React.useMemo(() => Array.from(picked.keys()), [picked])

  const attaching = Boolean(onAttach || onAttachClick)
  const uploading = attachments.some((item) => item.status === "uploading")
  const usable = attachments.filter((item) => (item.status ?? "ready") === "ready")
  const drafted = value.trim().length >= Math.max(1, minLength)
  const canSend = !disabled && ready && !uploading && (drafted || usable.length > 0) && (!busy || steerable)
  /* A draft typed mid-turn means the person has something to say to the turn:
     taking the send button away from them there is how a message gets lost. */
  const showStop = busy && Boolean(onStop) && !(steerable && (drafted || usable.length > 0))

  /* Grows with the draft up to a limit, then scrolls. Re-measured once fonts
     land and on resize, because a wrap point is a font metric. */
  const resize = React.useCallback(() => {
    const node = field.current
    if (!node) return
    node.style.height = "auto"
    node.style.height = `${Math.min(node.scrollHeight, maxHeight)}px`
  }, [maxHeight])
  React.useLayoutEffect(resize, [value, resize])
  React.useEffect(() => {
    const frame = requestAnimationFrame(resize)
    void document.fonts?.ready.then(resize)
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    }
  }, [resize])
  React.useEffect(() => {
    if (focusRequest) field.current?.focus()
  }, [focusRequest])

  const send = () => {
    if (!canSend) return
    const text = expandMentions(value.trim(), picked)
    onSubmit?.(text, usable)
    setValue("")
    setPicked(new Map())
    setMention(null)
    setSent((count) => count + 1)
  }

  /* Re-read after every edit and caret move. Deferred a microtask on change so
     the field's selection is the one after React wrote the new value. */
  const syncMention = () => {
    const node = field.current
    if (!node || !mentions) {
      setMention(null)
      return
    }
    const collapsed = node.selectionStart === node.selectionEnd
    setMention(collapsed ? mentionRange(node.value, node.selectionStart, pickedTokens) : null)
  }

  /* The `@…` being typed becomes the picked word plus a space — it is a word in
     a sentence still being written — and the caret lands after it. */
  const insertMention = (item: MentionItem) => {
    const node = field.current
    if (!node || !mention) return
    const { token, markup } = mentionToken(item)
    const next = `${value.slice(0, mention.start)}${token} ${value.slice(node.selectionStart)}`
    const caret = mention.start + token.length + 1
    const nextPicked = new Map(picked)
    nextPicked.set(token, markup)
    setPicked(nextPicked)
    setMention(null)
    setValue(next)
    node.focus()
    requestAnimationFrame(() => node.setSelectionRange(caret, caret))
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    /* While the picker is open it owns these keys (it catches them first). */
    if (mention && PICKER_KEYS.has(event.key)) return
    const sends = event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing
    if (sends) {
      event.preventDefault()
      send()
    }
  }

  const take = (files: Iterable<File> | ArrayLike<File> | null | undefined): boolean => {
    if (!onAttach || !files || disabled) return false
    const accepted = Array.from(files).filter((file) => acceptsFile(file, accept))
    if (accepted.length === 0) return false
    onAttach(accepted)
    return true
  }

  const dropHandlers = onAttach
    ? {
        onDragEnter: (event: React.DragEvent) => {
          if (!event.dataTransfer.types.includes("Files")) return
          event.preventDefault()
          setDragging(true)
        },
        onDragOver: (event: React.DragEvent) => {
          if (!event.dataTransfer.types.includes("Files")) return
          event.preventDefault()
          event.dataTransfer.dropEffect = "copy"
        },
        onDragLeave: (event: React.DragEvent) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        },
        onDrop: (event: React.DragEvent) => {
          if (!event.dataTransfer.files.length) return
          event.preventDefault()
          setDragging(false)
          take(event.dataTransfer.files)
          field.current?.focus()
        },
      }
    : {}

  const steering = busy && steerable && drafted ? labels.steering : null

  return (
    <div className={cn("op-thread-column", className)} data-slot="composer">
      <div className="relative">
        {mention && mentions && <MentionPicker items={mentions} onClose={() => setMention(null)} onPick={insertMention} query={mention.query} />}
        <div className="op-composer relative overflow-hidden" data-dragging={dragging || undefined} {...dropHandlers}>
          {notice && <div className="flex items-center gap-2 border-b border-[var(--border-surface-strong)] px-3 py-2 text-thread">{notice}</div>}
          {header}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {attachments.map((item) => (
                <AttachmentChip item={item} key={item.id} {...(onRemoveAttachment ? { onRemove: () => onRemoveAttachment(item.id) } : {})} />
              ))}
            </div>
          )}
          <div className="flex items-start gap-1.5 p-2" onClick={() => field.current?.focus()}>
            {attaching && (
              <button
                aria-label={labels.attach}
                className="grid size-7 shrink-0 place-items-center rounded-full bg-elevated text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                disabled={disabled}
                onClick={(event) => {
                  event.stopPropagation()
                  if (onAttachClick) onAttachClick()
                  else picker.current?.click()
                }}
                title={labels.attach}
                type="button"
              >
                <Plus className="size-3.5" />
              </button>
            )}
            {onAttach && (
              <input
                accept={accept}
                className="hidden"
                multiple={multiple}
                onChange={(event) => {
                  take(event.target.files)
                  event.target.value = ""
                }}
                ref={picker}
                tabIndex={-1}
                type="file"
              />
            )}
            <div className="relative min-w-0 flex-1">
              {mentions && <MentionTags ref={tagLayer} text={value} tokens={pickedTokens} />}
              <textarea
                autoFocus={autoFocus}
                className="op-scroll relative block w-full resize-none bg-transparent px-1.5 py-1 text-thread leading-[1.55] outline-none placeholder:text-muted-foreground/65 disabled:cursor-not-allowed"
                disabled={disabled}
                onBlur={() => setMention(null)}
                onChange={(event) => {
                  setValue(event.target.value)
                  queueMicrotask(syncMention)
                }}
                onClick={syncMention}
                onKeyDown={onKeyDown}
                onKeyUp={syncMention}
                onPaste={(event) => {
                  if (take(event.clipboardData.files)) event.preventDefault()
                }}
                onScroll={(event) => {
                  if (tagLayer.current) tagLayer.current.scrollTop = event.currentTarget.scrollTop
                }}
                placeholder={placeholder ?? labels.placeholder}
                ref={field}
                rows={1}
                value={value}
              />
            </div>
          </div>
          <AnimatePresence>
            {dragging && (
              <motion.div
                animate={{ opacity: 1 }}
                className="pointer-events-none absolute inset-1 z-10 grid place-items-center rounded-[calc(var(--radius-2xl)-4px)] border border-dashed border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--popover)_88%,transparent)] text-thread text-muted-foreground"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.12 }}
              >
                <span className="flex items-center gap-2">
                  <ImagePlus className="size-4" />
                  {labels.dropToAttach}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1 px-0.5">
        {leading}
        <div className="min-w-0 flex-1 truncate px-1 text-thread text-muted-foreground/65">{ready ? (hint ?? steering) : null}</div>
        {trailing}
        {showStop ? (
          <button
            aria-label={labels.stop}
            className="grid size-7 shrink-0 place-items-center rounded-full border border-border-strong bg-elevated text-foreground transition-colors hover:bg-accent"
            onClick={onStop}
            title={labels.stop}
            type="button"
          >
            <Square className="size-2.5 fill-current" />
          </button>
        ) : (
          <button
            aria-label={labels.send}
            className={cn(
              "grid size-7 shrink-0 place-items-center overflow-hidden rounded-full transition-[background-color,color,transform,opacity] duration-150",
              canSend ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-95" : "bg-elevated text-muted-foreground/50",
            )}
            disabled={!canSend}
            onClick={send}
            title={labels.send}
            type="button"
          >
            {/* The arrow goes with the message: it leaves upward and the next rises into its place. */}
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex"
                exit={reduced ? { opacity: 0 } : { y: -18, opacity: 0 }}
                initial={reduced ? false : { y: 14, opacity: 0 }}
                key={(busy && !steerable) || uploading ? "busy" : `idle-${sent}`}
                transition={reduced ? { duration: 0 } : { type: "spring", visualDuration: 0.34, bounce: 0.24 }}
              >
                {(busy && !steerable) || uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </div>
    </div>
  )
}

/** One image on the draft: a thumbnail, its upload state, and a way to take it off. */
export function AttachmentChip({ item, onRemove, className }: { item: ComposerAttachment; onRemove?: () => void; className?: string }) {
  const { labels } = useThreadConfig()
  const status = item.status ?? "ready"
  const name = item.name ?? "image"
  return (
    <div
      className={cn(
        "group/chip relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-[0.5px] ring-[var(--border-surface-strong)]",
        status === "error" && "ring-1 ring-destructive/70",
        className,
      )}
      title={status === "error" ? (item.error ?? labels.attachmentFailed) : name}
    >
      <img alt={name} className={cn("size-full object-cover transition-opacity", status === "uploading" && "opacity-50")} decoding="async" src={item.url} />
      {status === "uploading" && (
        <span aria-label={labels.uploading} className="absolute inset-0 grid place-items-center" role="status">
          {item.progress !== undefined ? <ProgressRing value={item.progress} /> : <Loader2 className="size-4 animate-spin text-foreground/80" />}
        </span>
      )}
      {status === "error" && (
        <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--destructive)_18%,transparent)]">
          <AlertCircle className="size-4 text-destructive" />
        </span>
      )}
      {onRemove && (
        <button
          aria-label={labels.removeAttachment(name)}
          className="absolute top-1 right-1 grid size-4.5 place-items-center rounded-full bg-[color-mix(in_oklab,var(--background)_85%,transparent)] text-foreground/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover/chip:opacity-100 hover:text-foreground focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          onClick={onRemove}
          type="button"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const r = 7
  const c = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <svg aria-hidden className="size-5 -rotate-90" viewBox="0 0 18 18">
      <circle className="stroke-foreground/20" cx="9" cy="9" fill="none" r={r} strokeWidth="2" />
      <circle className="stroke-foreground transition-[stroke-dashoffset]" cx="9" cy="9" fill="none" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

/** A quiet control for the composer's lower row: a model, a mode, a toggle. */
export function ComposerPill({
  icon: Icon,
  children,
  onClick,
  active = false,
  chevron = false,
  tone = "default",
  static: still = false,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  active?: boolean
  chevron?: boolean
  /** `warning` for a condition worth noticing: a model that is offline. */
  tone?: "default" | "warning"
  /** Draw as a span — a label, not a control. */
  static?: boolean
}) {
  const label = still
  const Tag = label ? "span" : "button"
  return (
    <Tag
      className={cn(
        "inline-flex h-7 shrink-0 cursor-default items-center gap-1.5 rounded-md px-2 text-thread transition-colors",
        tone === "warning" ? "text-warning" : "text-muted-foreground",
        !label && "hover:bg-elevated hover:text-foreground aria-expanded:bg-elevated aria-expanded:text-foreground",
        active && "bg-elevated text-foreground",
        className,
      )}
      onClick={onClick}
      {...(label ? {} : { type: "button" as const })}
      {...(props as React.HTMLAttributes<HTMLElement>)}
    >
      {Icon && <Icon className="size-3.5" />}
      <span className="truncate">{children}</span>
      {chevron && <ChevronDown className="size-3.5 opacity-50" />}
    </Tag>
  )
}

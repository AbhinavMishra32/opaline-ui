import * as React from "react"
import { useReducedMotion } from "motion/react"
import type { Highlighter } from "./highlight"
import type { CustomPart, ToolRegistry } from "./types"

export type ThreadLabels = {
  working: (elapsed: string) => string
  worked: (length: string) => string
  connecting: string
  waiting: string
  thinking: string
  thoughtFor: (seconds: number) => string
  copy: string
  copied: string
  edit: string
  resend: string
  cancel: string
  rate: string
  rateGood: string
  rateBad: string
  jumpToLatest: string
  send: string
  stop: string
  placeholder: string
  turnFailed: string
  showDetails: string
  hideDetails: string
  input: string
  output: string
  failed: string
  stopped: string
  showFullOutput: (lines: number) => string
  collapseOutput: string
  pending: string
  /** "Copy failed — try again" */
  copyFailed: string
  /** The rating control's tooltip once rated. */
  rated: (verdict: string) => string
  /** A running ask-the-user tool's detail. */
  waitingForAnswer: string
  /** A tool row's panel headings for the reasoning around the call. */
  /** A settled tool with no registered title or output. */
  done: string
  /** The fold's tooltip. */
  foldTitle: (length: string, open: boolean) => string
  loadingSteps: string
  stepsFailed: string
  /** The composer's hint while the agent works and a draft is typed. */
  steering: string
  attach: string
  removeAttachment: (name: string) => string
  uploading: string
  attachmentFailed: string
  dropToAttach: string
  viewImage: (name: string) => string
  /** How long ago a message was sent, shown on hover. */
  relativeTime: (ms: number) => string
  showAllLines: (lines: number) => string
  exitCode: (code: number) => string
  noResults: string
  /* Questions */
  answerPlaceholder: string
  answerPlaceholderSole: string
  customAnswer: string
  ownAnswer: string
  questionSending: string
  questionHintTyping: string
  questionHintMultiple: string
  questionHintReady: string
  questionHintPick: string
  back: string
  nextQuestion: string
  sendAnswer: string
  dismissQuestion: string
  questionCancelled: string
  /* Mentions */
  /** The picker's top level, in its breadcrumb. */
  mentionRoot: string
  /** The heading over an opened item's own row. */
  mentionItself: string
  mentionEmpty: (query: string) => string
}

export const defaultLabels: ThreadLabels = {
  working: (elapsed) => `Working for ${elapsed}`,
  worked: (length) => `Worked for ${length}`,
  connecting: "Connecting to the model",
  waiting: "Working",
  thinking: "Thinking",
  thoughtFor: (seconds) => `Thought for ${seconds}s`,
  copy: "Copy",
  copied: "Copied",
  edit: "Edit and run again from here",
  resend: "Send again",
  cancel: "Cancel",
  rate: "Rate this response",
  rateGood: "Good response",
  rateBad: "Bad response",
  jumpToLatest: "Jump to latest",
  send: "Send",
  stop: "Stop",
  placeholder: "Ask anything…",
  turnFailed: "That turn did not finish",
  showDetails: "Show details",
  hideDetails: "Hide details",
  input: "Input",
  output: "Output",
  failed: "Failed",
  stopped: "Stopped",
  showFullOutput: (lines) => `Show full output · ${lines} lines`,
  collapseOutput: "Collapse output",
  pending: "Waiting for the agent to finish this step",
  copyFailed: "Copy failed — try again",
  rated: (verdict) => `${verdict} — rate again to change`,
  waitingForAnswer: "Waiting for your answer",
  done: "Done",
  foldTitle: (length, open) => `${length} of work — click to ${open ? "hide" : "see"} the steps`,
  loadingSteps: "Loading the steps…",
  stepsFailed: "Those steps could not be loaded. Try again",
  steering: "Return to send — the agent picks this up at its next step",
  attach: "Attach images",
  removeAttachment: (name) => `Remove ${name}`,
  uploading: "Uploading",
  attachmentFailed: "Could not upload",
  dropToAttach: "Drop images to attach",
  viewImage: (name) => `View ${name}`,
  relativeTime: relativeMessageTime,
  showAllLines: (lines) => `Show all ${lines} lines`,
  exitCode: (code) => `exit ${code}`,
  noResults: "No results",
  answerPlaceholder: "Type your answer…",
  answerPlaceholderSole: "Answer in your own words.",
  customAnswer: "Or type your own answer…",
  ownAnswer: "Your own answer",
  questionSending: "Sending…",
  questionHintTyping: "Return to send · Shift + Return for a new line",
  questionHintMultiple: "Pick as many as apply · Return to send",
  questionHintReady: "Return to send",
  questionHintPick: "Press a number, or click",
  back: "Back",
  nextQuestion: "Next question",
  sendAnswer: "Send answer",
  dismissQuestion: "Skip",
  questionCancelled: "Not answered",
  mentionRoot: "Mention",
  mentionItself: "This one",
  mentionEmpty: (query) => (query ? `Nothing matches “${query}”` : "Nothing to mention yet"),
}

/** "just now", "4 min ago", "2 h ago", "3 days ago". */
export function relativeMessageTime(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 45) return "just now"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? "yesterday" : `${days} days ago`
}

/**
 * Inline `[[kind:target|label]]` references the agent writes. Every kind is
 * live once something can open it; `file` falls back to `onOpenFile`.
 */
export type ReferenceConfig = {
  /** Open a reference. Without it (and `onOpenFile` for files) a reference is plain text. */
  onOpen?: (reference: { kind: string; target: string; label: string }) => void
  /**
   * Whether a reference's target exists, from data the host already holds. A
   * missing one offers `onCreate`. Synchronous on purpose: the thread renders
   * what it is given and never goes looking.
   */
  exists?: (reference: { kind: string; target: string }) => boolean
  onCreate?: (reference: { kind: string; target: string; label: string }) => void
  /** The glyph for a kind, in the footer cards and chips. */
  icon?: (kind: string) => React.ComponentType<{ className?: string }> | undefined
  /** Kinds gathered as cards under the reply. Default: none. */
  footer?: string[]
}

export type ThreadConfig = {
  /** How each tool is drawn, keyed by tool name. See `defineTools`. */
  tools?: ToolRegistry
  /** Every string the thread draws, for copy changes or translation. */
  labels?: Partial<ThreadLabels>
  /** Replace the built-in markdown renderer (e.g. with react-markdown). */
  renderMarkdown?: (text: string, options: { streaming: boolean }) => React.ReactNode
  /**
   * Which markdown images may load, and from where: return the URL to load, or
   * `null` to print the line as text. Default `httpsImages`: remote https only,
   * since a model has no business pointing at local files. Hosts that serve
   * their own media (signed links on their API) widen it to their origin.
   */
  images?: (src: string) => string | null
  /**
   * Colours code — fenced blocks, files being written, inline code. Returns
   * tokens now or later; the code draws plain until they land. Plug in a
   * real parser here if you want one. Default: the built-in `tokenize`.
   */
  highlighter?: Highlighter
  /** Draw a fenced block's body yourself (Shiki's HTML, say). Wins over `highlighter`. */
  highlight?: (code: string, language: string) => React.ReactNode
  /** Draw a `custom` part. */
  renderPart?: (part: CustomPart) => React.ReactNode
  /** Called when a row's path subject is clicked. Paths are inert without it. */
  onOpenFile?: (path: string) => void
  /**
   * Called when a link in the agent's prose is followed. With it links are
   * buttons (for apps that cannot navigate); without it they are anchors that
   * open a new tab.
   */
  onOpenUrl?: (url: string) => void
  /** `[[kind:target|label]]` references. See `ReferenceConfig`. */
  references?: ReferenceConfig
  /** The language inline code is coloured as. A fenced block names its own. */
  codeLanguage?: string
  /**
   * Draw a fenced block yourself — a chart for ```chart, a figure for
   * ```figure. Return `undefined` to fall through to the built-in block.
   */
  renderCodeBlock?: (block: { code: string; language: string }) => React.ReactNode | undefined
  /**
   * How a settled turn names its length. `"playful"` (default) says a short
   * turn took "one sip of coffee" and a long one "2m 14s"; `"precise"` always
   * gives the figure; a function decides for itself.
   */
  duration?: "playful" | "precise" | ((ms: number) => string)
  /**
   * The work fold. `"auto"` (default) opens while the agent works and closes
   * when it starts answering; `"open"` and `"closed"` fix it; `"none"` draws
   * the steps inline with no fold at all.
   */
  fold?: "auto" | "open" | "closed" | "none"
  /** Turn every entrance and fold off. Reduced-motion users get this anyway. */
  animate?: boolean
}

type ResolvedConfig = Omit<ThreadConfig, "labels" | "tools"> & {
  labels: ThreadLabels
  tools: ToolRegistry
  reduced: boolean
}

const Context = React.createContext<ThreadConfig>({})

/**
 * Configures every thread component beneath it. Nests: an inner provider
 * merges over the outer one, so an app can set tools once and a screen can
 * change a label.
 */
export function ThreadProvider({ children, ...config }: ThreadConfig & { children: React.ReactNode }) {
  const outer = React.useContext(Context)
  const value: ThreadConfig = {
    ...outer,
    ...stripUndefined(config),
    tools: { ...outer.tools, ...config.tools },
    labels: { ...outer.labels, ...config.labels },
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useThreadConfig(): ResolvedConfig {
  const config = React.useContext(Context)
  const systemReduced = useReducedMotion() ?? false
  return React.useMemo(
    () => ({
      ...config,
      tools: config.tools ?? {},
      labels: { ...defaultLabels, ...config.labels },
      reduced: systemReduced || config.animate === false,
    }),
    [config, systemReduced],
  )
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>
}

/** The default `images` policy: load remote https images, print anything else as text. */
export function httpsImages(src: string): string | null {
  return src.startsWith("https://") ? src : null
}

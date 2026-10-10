import type * as React from "react"

/**
 * The thread's data model.
 *
 * Deliberately plain: serialisable objects you can keep in state, store, or
 * stream into. Nothing here knows about a provider. Adapters (`fromAISDK`) and
 * the streaming reducer (`reduceThread`) produce these shapes; the components
 * only read them.
 */

export type ToolStatus = "running" | "done" | "error"

export type TextPart = {
  type: "text"
  id: string
  text: string
}

/**
 * The model's own reasoning. `streaming` while more is still coming, which is
 * what makes the row read as thinking rather than as a block that arrived done.
 * Bold lines at the start of a paragraph (`**Planning the change**`) become the
 * row's live heading.
 */
export type ReasoningPart = {
  type: "reasoning"
  id: string
  text: string
  streaming?: boolean
  /** Epoch ms. With `endedAt`, names the row "Thought for 12s". */
  startedAt?: number
  endedAt?: number
}

export type ToolPart = {
  type: "tool"
  id: string
  /** The tool's name as the agent called it: `read_file`, `web-search`, … */
  name: string
  status: ToolStatus
  /** Arguments, as an object or a string. Rendered as JSON when no view is registered. */
  input?: unknown
  /** Result, once settled. */
  output?: unknown
  /** The error text, when `status` is `"error"`. */
  error?: string
  /** Overrides the registry's title for this one call. */
  title?: string
  /** A short result beside the title — `23 matches`, `exit 0`. */
  detail?: string
  /** Lines changed, drawn as a `+12 -3` diff stat. */
  diff?: { added: number; removed: number }
  startedAt?: number
  endedAt?: number
}

/** A line the host says about the turn — a retry, a rejected draft. */
export type StatusPart = {
  type: "status"
  id: string
  text: string
  tone?: "neutral" | "warning"
}

/** The turn failed. Drawn as a card, with any detail behind a disclosure. */
export type ErrorPart = {
  type: "error"
  id: string
  title?: string
  text: string
}

/** Anything else: rendered by `renderPart` in the thread config. */
export type CustomPart = {
  type: "custom"
  id: string
  kind: string
  data?: unknown
  /** Draw on the step gutter (true) or as a full-width card (false, default). */
  inline?: boolean
}

/* ---- Questions ----------------------------------------------------------- */

export type QuestionOption = {
  label: string
  /** A muted line under the label. */
  description?: string
}

/** One question the agent asks. A card holds one to three of them. */
export type Question = {
  /** A short tag: "Scope", "Format". Prefixes the answer when there are several. */
  header: string
  question: string
  /** Zero to four choices. With none, the question takes a typed answer only. */
  options: QuestionOption[]
  /** Pick any number of options rather than one. */
  multiple?: boolean
  /** Offer a free-text answer beside the options. Default true. */
  custom?: boolean
}

/** The answer to one question: the option labels picked, and any typed text. */
export type QuestionAnswer = {
  selected: string[]
  custom?: string
}

/**
 * The agent stopped to ask. `pending` draws the interactive card (in place of
 * the composer, or inline); `answered` and `cancelled` draw a read-only
 * exchange. `answers` lines up with `questions` by index.
 */
export type QuestionPart = {
  type: "question"
  id: string
  questions: Question[]
  status: "pending" | "answered" | "cancelled"
  answers?: QuestionAnswer[]
}

export type MessagePart = TextPart | ReasoningPart | ToolPart | StatusPart | ErrorPart | QuestionPart | CustomPart

/** An image sent with a user message. */
export type Attachment = {
  id: string
  url: string
  name?: string
  mimeType?: string
  width?: number
  height?: number
}

export type UserMessage = {
  id: string
  role: "user"
  text: string
  /** Images sent with the message, drawn as thumbnails above the bubble. */
  attachments?: Attachment[]
  createdAt?: number | string
  /** Sent but not yet seen by the agent (queued mid-turn). Drawn dimmed. */
  pending?: boolean
}

export type AssistantMessage = {
  id: string
  role: "assistant"
  parts: MessagePart[]
  /** Defaults to `"done"`. */
  status?: "streaming" | "done" | "error"
  createdAt?: number | string
  startedAt?: number
  /**
   * Where the work ends and the reply begins. Everything before this index is
   * folded under "Worked for…" once the reply starts; everything from it is the
   * answer. When omitted it is inferred: the last run of text parts, plus (once the turn
   * is over) any finished steps and cards after it.
   */
  replyFrom?: number
  /** When the reply began. Closes a live fold. Inferred when omitted. */
  replyStartedAt?: number
  /** A settled turn's total, for turns without `startedAt`. */
  durationMs?: number
  rating?: "good" | "bad" | null
  /**
   * Steps kept elsewhere — on disk, behind an API — rather than in `parts`.
   * The fold still shows, and asks for them through `onLoadWork` when opened.
   */
  deferredSteps?: number
}

/**
 * A line between turns: "Model switched to …", "Context compacted".
 *
 * `event` (default) draws an icon row whose first sentence is the title and
 * whose rest opens behind a disclosure; `rule` draws a milestone between
 * gradient hairlines; `divider` is a quiet centred line between two rules.
 */
export type SystemMessage = {
  id: string
  role: "system"
  text: string
  variant?: "event" | "rule" | "divider"
  /** Overrides the title split from `text`. */
  title?: string
  /** Overrides the detail split from `text`. */
  detail?: string
  tone?: "neutral" | "success" | "warning" | "danger" | "info"
  icon?: React.ComponentType<{ className?: string }>
  createdAt?: number | string
}

export type ThreadMessage = UserMessage | AssistantMessage | SystemMessage

/* ---- Tool registry ------------------------------------------------------- */

/**
 * An animated orb. A running step normally pulses its own mark; a tool whose
 * definition names an orb spins that instead — for a long, multi-stage job a
 * host wants to read as its own kind of thing.
 */
export type OrbKind =
  | "working"
  | "searching"
  | "connecting"
  | "shaping"
  | "weaving"
  | "solving"
  | "listening"
  | "breathing"
  | "composing"

export type ToolRenderProps<TInput = any, TOutput = any> = {
  part: ToolPart
  input: TInput
  output: TOutput
  status: ToolStatus
}

/**
 * How one tool is drawn. Every field is optional; anything left out falls back
 * to what the name suggests (`read_*` reads, `search_*` searches) and then to a
 * neutral dot.
 */
export type ToolDefinition<TInput = any, TOutput = any> = {
  /** The settled mark: a component taking `className`. */
  icon?: React.ComponentType<{ className?: string }>
  /** Spin this orb while running instead of pulsing the icon. Leave out for the usual pulse. */
  orb?: OrbKind
  /**
   * The row's label. A string, or a function of the call, e.g.
   * `({ status }) => status === "running" ? "Reading" : "Read"`.
   */
  title?: string | ((props: ToolRenderProps<TInput, TOutput>) => string)
  /**
   * What the call was about, set after the title: `Read` + `main.py`. When it
   * looks like a path the row offers it to `onOpenFile`.
   */
  subject?: (props: ToolRenderProps<TInput, TOutput>) => string | undefined
  /** A short result beside the title once settled. */
  detail?: (props: ToolRenderProps<TInput, TOutput>) => string | undefined
  /**
   * The panel the row opens onto. Return `null` for a row with nothing to open.
   * Omit to show the input and output as formatted payloads.
   */
  render?: (props: ToolRenderProps<TInput, TOutput>) => React.ReactNode
  /** Draw `render` without the block surface — for conversational tools. */
  bare?: boolean
  /** Show elapsed time (`in 3.2s`) once settled. Default true. */
  timed?: boolean
}

export type ToolRegistry = Record<string, ToolDefinition>

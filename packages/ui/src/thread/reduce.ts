import type { AssistantMessage, Attachment, MessagePart, Question, QuestionAnswer, ThreadMessage, ToolPart } from "./types"

/**
 * Events a turn streams, in the shape most agent loops already emit. Fold them
 * into messages with `reduceThread`; the thread re-renders as they arrive.
 */
export type ThreadEvent =
  | { type: "user"; id: string; text: string; attachments?: Attachment[]; at?: number }
  | { type: "turn-start"; id: string; at?: number }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "reasoning-start"; id: string; at?: number }
  | { type: "reasoning-delta"; id: string; delta: string }
  | { type: "reasoning-end"; id: string; at?: number }
  | { type: "tool-start"; id: string; callId: string; name: string; input?: unknown; title?: string; at?: number }
  | { type: "tool-update"; id: string; callId: string; input?: unknown; detail?: string; diff?: ToolPart["diff"] }
  | { type: "tool-end"; id: string; callId: string; output?: unknown; error?: string; detail?: string; diff?: ToolPart["diff"]; at?: number }
  /** The agent stopped working and started answering: closes the fold. */
  | { type: "reply-start"; id: string; at?: number }
  | { type: "status"; id: string; text: string; tone?: "neutral" | "warning" }
  | { type: "error"; id: string; text: string; title?: string }
  | { type: "turn-end"; id: string; at?: number }
  /** The agent asks the person something. Adds a pending `QuestionPart`. */
  | { type: "question"; id: string; partId: string; questions: Question[]; at?: number }
  /** The person answered. `id` (the turn) is optional: the part is found by `partId`. */
  | { type: "question-answer"; id?: string; partId: string; answers: QuestionAnswer[] }
  | { type: "question-cancel"; id?: string; partId: string }

/**
 * How much of one block of thought or one answer is kept. A turn that thinks
 * for ninety seconds is hundreds of thousands of intermediate strings if every
 * token copies everything said so far; the cap keeps the head, which is the
 * part worth reading.
 */
const MAX_BODY = 40_000

function extend(body: string, text: string): string {
  if (body.length >= MAX_BODY) return body
  const next = body + text
  return next.length <= MAX_BODY ? next : `${next.slice(0, MAX_BODY)}…`
}

/** A word of the answer, or a call, closes the thinking that came before it. */
function closeReasoning(parts: MessagePart[], at: number): MessagePart[] {
  return parts.map((part) => (part.type === "reasoning" && part.streaming ? { ...part, streaming: false, endedAt: at } : part))
}

function updateTurn(messages: ThreadMessage[], id: string, at: number, update: (turn: AssistantMessage) => AssistantMessage): ThreadMessage[] {
  const index = messages.findLastIndex((message) => message.role === "assistant" && message.id === id)
  if (index === -1) {
    const turn: AssistantMessage = { id, role: "assistant", parts: [], status: "streaming", startedAt: at }
    return [...messages, update(turn)]
  }
  const next = messages.slice()
  next[index] = update(messages[index] as AssistantMessage)
  return next
}

/** Settle a question part wherever it is, by its id. */
function settleQuestion(messages: ThreadMessage[], partId: string, update: (part: Extract<MessagePart, { type: "question" }>) => MessagePart): ThreadMessage[] {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    if (message?.role !== "assistant") continue
    const at = message.parts.findIndex((part) => part.type === "question" && part.id === partId)
    if (at === -1) continue
    const parts = message.parts.slice()
    parts[at] = update(parts[at] as Extract<MessagePart, { type: "question" }>)
    const next = messages.slice()
    next[index] = { ...message, parts }
    return next
  }
  return messages
}

export function reduceThread(messages: ThreadMessage[], event: ThreadEvent): ThreadMessage[] {
  const at = ("at" in event && event.at) || Date.now()
  if (event.type === "user") {
    return [...messages, { id: event.id, role: "user", text: event.text, createdAt: at, ...(event.attachments?.length ? { attachments: event.attachments } : {}) }]
  }
  if (event.type === "question-answer") return settleQuestion(messages, event.partId, (part) => ({ ...part, status: "answered", answers: event.answers }))
  if (event.type === "question-cancel") return settleQuestion(messages, event.partId, (part) => ({ ...part, status: "cancelled" }))

  return updateTurn(messages, event.id, at, (turn) => {
    const parts = turn.parts
    const last = parts.at(-1)
    switch (event.type) {
      case "turn-start":
        return { ...turn, status: "streaming", startedAt: turn.startedAt ?? at }
      case "text-delta": {
        if (!event.delta) return turn
        const settled = closeReasoning(parts, at)
        const tail = settled.at(-1)
        if (tail?.type === "text") settled[settled.length - 1] = { ...tail, text: extend(tail.text, event.delta) }
        else settled.push({ type: "text", id: `${turn.id}-t${settled.length}`, text: event.delta })
        return { ...turn, parts: settled }
      }
      case "reasoning-start": {
        const settled = closeReasoning(parts, at)
        settled.push({ type: "reasoning", id: `${turn.id}-r${settled.length}`, text: "", streaming: true, startedAt: at })
        return { ...turn, parts: settled }
      }
      case "reasoning-delta": {
        if (!event.delta) return turn
        /* Continues the trailing block, even a closed one, if nothing happened
           between: a turn of several provider calls is still one thought. */
        if (last?.type === "reasoning") {
          const next = parts.slice()
          next[next.length - 1] = { ...last, text: extend(last.text, event.delta), streaming: true, endedAt: undefined }
          return { ...turn, parts: next }
        }
        return { ...turn, parts: [...parts, { type: "reasoning", id: `${turn.id}-r${parts.length}`, text: event.delta, streaming: true, startedAt: at }] }
      }
      case "reasoning-end":
        return { ...turn, parts: closeReasoning(parts, at) }
      case "tool-start": {
        const part: ToolPart = { type: "tool", id: event.callId, name: event.name, status: "running", startedAt: at }
        if (event.input !== undefined) part.input = event.input
        if (event.title) part.title = event.title
        return { ...turn, parts: [...closeReasoning(parts, at), part] }
      }
      case "tool-update":
      case "tool-end": {
        const next = parts.map((part): MessagePart => {
          if (part.type !== "tool" || part.id !== event.callId) return part
          const updated: ToolPart = { ...part }
          if (event.detail !== undefined) updated.detail = event.detail
          if (event.diff !== undefined) updated.diff = event.diff
          if (event.type === "tool-update") {
            if (event.input !== undefined) updated.input = event.input
            return updated
          }
          if (event.output !== undefined) updated.output = event.output
          if (event.error !== undefined) updated.error = event.error
          updated.status = event.error !== undefined ? "error" : "done"
          updated.endedAt = at
          return updated
        })
        return { ...turn, parts: next }
      }
      case "reply-start":
        return { ...turn, parts: closeReasoning(parts, at), replyFrom: parts.length, replyStartedAt: at }
      case "status":
        return { ...turn, parts: [...parts, { type: "status", id: `${turn.id}-s${parts.length}`, text: event.text, ...(event.tone ? { tone: event.tone } : {}) }] }
      case "error":
        return {
          ...turn,
          status: "error",
          parts: [...closeReasoning(parts, at), { type: "error", id: `${turn.id}-e${parts.length}`, text: event.text, ...(event.title ? { title: event.title } : {}) }],
        }
      case "question":
        return {
          ...turn,
          parts: [...closeReasoning(parts, at), { type: "question", id: event.partId, questions: event.questions, status: "pending" }],
        }
      case "turn-end": {
        const settled = closeReasoning(parts, at).map((part): MessagePart =>
          part.type === "tool" && part.status === "running" ? { ...part, status: "done", endedAt: at } : part,
        )
        return {
          ...turn,
          parts: settled,
          status: turn.status === "error" ? "error" : "done",
          durationMs: turn.startedAt ? (turn.replyStartedAt ?? at) - turn.startedAt : turn.durationMs,
        }
      }
      default:
        return turn
    }
  })
}

/** Apply a batch at once — a frame's worth of tokens is one state update, not hundreds. */
export function reduceThreadBatch(messages: ThreadMessage[], events: readonly ThreadEvent[]): ThreadMessage[] {
  return events.reduce(reduceThread, messages)
}

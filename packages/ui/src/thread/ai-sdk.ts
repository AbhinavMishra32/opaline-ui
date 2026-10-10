import * as React from "react"
import { isAskTool } from "./group"
import { questionExchange, readQuestions } from "./question-exchange"
import type { Attachment, MessagePart, Question, QuestionAnswer, ThreadMessage, ToolPart } from "./types"

/**
 * The Vercel AI SDK's `UIMessage`, typed structurally so Opaline does not
 * depend on the `ai` package. Anything `useChat` returns fits.
 */
export type AISDKPart =
  | { type: "text"; text: string; state?: "streaming" | "done" }
  | { type: "reasoning"; text: string; state?: "streaming" | "done" }
  | { type: "step-start" }
  | {
      type: string
      toolCallId?: string
      toolName?: string
      state?: "input-streaming" | "input-available" | "output-available" | "output-error" | string
      input?: unknown
      output?: unknown
      errorText?: string
      [key: string]: unknown
    }

export type AISDKMessage = {
  id: string
  role: "user" | "assistant" | "system"
  parts: AISDKPart[]
  metadata?: unknown
}

/** Answer strings back into picked options and typed text, by question. */
export function answersFromText(questions: readonly Question[], output: unknown): QuestionAnswer[] {
  const exchanges = questionExchange({ questions }, output)
  return questions.map((question, index) => {
    const answer = exchanges.length === questions.length ? (exchanges[index]?.answer ?? "") : index === 0 ? (exchanges[0]?.answer ?? "") : ""
    const labels = question.options.map((option) => option.label)
    const pieces = answer.split(/,\s*/).map((piece) => piece.trim()).filter(Boolean)
    const selected = pieces.filter((piece) => labels.includes(piece))
    if (pieces.length > 0 && selected.length === pieces.length) return { selected }
    return answer.trim() ? { selected: [], custom: answer.trim() } : { selected: [] }
  })
}

function attachmentsOf(message: AISDKMessage): Attachment[] {
  return message.parts.flatMap((part, index): Attachment[] => {
    if (part.type !== "file") return []
    const file = part as { url?: unknown; mediaType?: unknown; filename?: unknown }
    if (typeof file.url !== "string" || typeof file.mediaType !== "string" || !file.mediaType.startsWith("image/")) return []
    return [{ id: `${message.id}:${index}`, url: file.url, mimeType: file.mediaType, ...(typeof file.filename === "string" ? { name: file.filename } : {}) }]
  })
}

export type FromAISDKOptions = {
  /**
   * Draw ask-the-user tool calls that carry `{ questions: [...] }` as question
   * parts (default true). Answer one with
   * `addToolResult({ tool, toolCallId: partId, output: formatQuestionAnswers(questions, answers) })`.
   */
  questions?: boolean
}

/** `useChat`'s status. */
export type AISDKStatus = "submitted" | "streaming" | "ready" | "error"

type Timings = Map<string, { startedAt: number; endedAt?: number }>

function toolStatus(state: string | undefined): ToolPart["status"] {
  if (state === "output-available") return "done"
  if (state === "output-error") return "error"
  return "running"
}

/**
 * Converts `useChat` messages into thread messages. Prefer the hook
 * `useAISDKThread`, which also remembers when each step started and ended so
 * the thread can say how long things took — the SDK does not record timings.
 */
export function fromAISDK(messages: AISDKMessage[], status: AISDKStatus = "ready", timings?: Timings, options: FromAISDKOptions = {}): ThreadMessage[] {
  const now = Date.now()
  const stamp = (key: string, done: boolean): { startedAt?: number; endedAt?: number } => {
    if (!timings) return {}
    let entry = timings.get(key)
    /* Already finished the first time we saw it — history. No timing is better than a wrong one. */
    if (!entry && done) return {}
    if (!entry) {
      entry = { startedAt: now }
      timings.set(key, entry)
    }
    if (done && entry.endedAt === undefined) entry.endedAt = now
    return entry
  }

  const live = status === "streaming" || status === "submitted"
  const lastAssistant = messages.findLastIndex((message) => message.role === "assistant")
  const result: ThreadMessage[] = messages.map((message, index) => {
    const text = message.parts.filter((part): part is { type: "text"; text: string } => part.type === "text").map((part) => part.text).join("")
    if (message.role === "user") {
      const attachments = attachmentsOf(message)
      return { id: message.id, role: "user", text, ...(attachments.length ? { attachments } : {}) }
    }
    if (message.role === "system") return { id: message.id, role: "system", text }

    const streaming = live && index === lastAssistant && index === messages.length - 1
    const parts: MessagePart[] = []
    message.parts.forEach((part, partIndex) => {
      const key = `${message.id}:${partIndex}`
      if (part.type === "text") {
        const value = (part as { text: string }).text
        if (value) parts.push({ type: "text", id: key, text: value })
      } else if (part.type === "reasoning") {
        const reasoning = part as { text: string; state?: string }
        const open = streaming && reasoning.state !== "done"
        const time = stamp(key, !open)
        parts.push({ type: "reasoning", id: key, text: reasoning.text, streaming: open, ...time })
      } else if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
        const tool = part as Extract<AISDKPart, { toolCallId?: string }>
        const name = part.type === "dynamic-tool" ? String(tool.toolName ?? "tool") : part.type.slice(5)
        const status = toolStatus(tool.state)
        const questions = options.questions !== false && isAskTool(name) ? readQuestions(tool.input) : []
        if (questions.length > 0 && tool.state !== "input-streaming") {
          const id = tool.toolCallId ?? key
          if (status === "running") parts.push({ type: "question", id, questions, status: "pending" })
          else if (status === "error" || questionExchange(tool.input, tool.output).length === 0) parts.push({ type: "question", id, questions, status: "cancelled" })
          else parts.push({ type: "question", id, questions, status: "answered", answers: answersFromText(questions, tool.output) })
          return
        }
        const time = stamp(tool.toolCallId ?? key, status !== "running")
        const toolPart: ToolPart = { type: "tool", id: tool.toolCallId ?? key, name, status, ...time }
        if (tool.input !== undefined) toolPart.input = tool.input
        if (tool.output !== undefined) toolPart.output = tool.output
        if (tool.errorText) toolPart.error = tool.errorText
        parts.push(toolPart)
      }
    })
    const turn = stamp(`${message.id}:turn`, !streaming)
    return {
      id: message.id,
      role: "assistant",
      parts,
      status: status === "error" && index === lastAssistant ? "error" : streaming ? "streaming" : "done",
      ...(turn.startedAt !== undefined ? { startedAt: turn.startedAt } : {}),
      ...(turn.startedAt !== undefined && turn.endedAt !== undefined ? { durationMs: turn.endedAt - turn.startedAt } : {}),
    }
  })

  /* Submitted, and the reply has not begun: a turn with nothing in it yet, so
     the thread can say it is connecting rather than show nothing. */
  if (status === "submitted" && messages.at(-1)?.role === "user") {
    result.push({ id: "pending-turn", role: "assistant", parts: [], status: "streaming", startedAt: now })
  }
  return result
}

/**
 * `useChat` → `<AgentThread>`:
 *
 *   const { messages, status, sendMessage, stop } = useChat()
 *   const thread = useAISDKThread(messages, status)
 *   <AgentThread messages={thread} onSend={(text) => sendMessage({ text })} onStop={stop} />
 */
export function useAISDKThread(messages: AISDKMessage[], status: AISDKStatus = "ready", options?: FromAISDKOptions): ThreadMessage[] {
  const timings = React.useRef<Timings>(new Map())
  return fromAISDK(messages, status, timings.current, options)
}

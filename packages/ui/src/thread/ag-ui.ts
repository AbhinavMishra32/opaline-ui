/**
 * AG-UI in, thread messages out.
 *
 * AG-UI (docs.ag-ui.com) is the open event protocol between agents and apps.
 * A run streams events, and every block of the reply (a thought, a piece of
 * text, a tool call) is its own message with its own id:
 *
 *   RUN_STARTED                       a turn opens
 *   REASONING_MESSAGE_START / CONTENT / END   a thought, by messageId
 *   TEXT_MESSAGE_START / CONTENT / END        text, by messageId
 *   TOOL_CALL_START / ARGS / END / RESULT     a tool call, by toolCallId
 *   CUSTOM "tool.activity"            what a tool call is doing, in words
 *   CUSTOM "tool.output"              what a running tool has so far
 *   RUN_FINISHED | RUN_ERROR          the turn ends
 *
 * A tool call's words. AG-UI has no field for "what this call is doing", so
 * a host that has them sends AG-UI's own extension event while the call
 * streams, as often as they grow:
 *
 *   CUSTOM { name: "tool.activity",
 *            value: { toolCallId, activity: "Finding your chat model files",
 *                     activityDone?: "Found your chat model files",
 *                     labelKeys?: ["activity", "activity_done"] } }
 *
 * and keeps them on the saved call, in the message's metadata:
 *
 *   { role: "assistant", toolCalls: [t1], metadata: { toolActivity: { t1: { activity, activityDone } } } }
 *
 * The row shows `activity` while the call runs and `activityDone` once it
 * worked. `labelKeys` are arguments that only carried the words; they're
 * left out of the input the row shows.
 *
 * A running tool's output. A tool that takes a while can send what it has
 * so far, the whole text each time, until its result arrives:
 *
 *   CUSTOM { name: "tool.output", value: { toolCallId, output: "10\n9\n8" } }
 *
 * The row shows its last line while it runs, and all of it when opened.
 *
 * A result that came back because you pressed Stop says so in its metadata,
 * and the row shows it as stopped, not failed:
 *
 *   { role: "tool", toolCallId, content: "Stopped at 20.", metadata: { stopped: true } }
 *
 * The thread draws one run as one assistant turn whose parts are those
 * blocks. Every delta finds its part by id, so blocks can stream at the
 * same time and still land in the right place.
 *
 * Everything here is a plain function: (messages, event) → new messages.
 * Keep the result in state however you like, or use `useAGUIThread`.
 *
 *   applyAGUIEvent     one streaming event
 *   applyAGUIMessage   one finished message (saved, or sent by you)
 *   messagesFromAGUI   a whole saved chat, when the thread opens
 *
 * Which turn an event belongs to: the `runId` you pass, else the run the
 * event names, else the last turn still streaming, else a new one. A new
 * turn goes after everything except messages still waiting for an answer
 * (user messages marked `pending`), which stay below it.
 *
 * The AG-UI types are written out structurally, so Opaline doesn't depend on
 * `@ag-ui/core`; its events and messages fit.
 */
import * as React from "react"
import type { AssistantMessage, MessagePart, ThreadMessage, ToolPart, UserMessage } from "./types"

export type AGUIToolCall = {
  id: string
  type?: "function"
  function: { name: string; arguments: string }
}

/** A piece of a user message: text, or an image or file the host draws itself. */
export type AGUIContentPart = { type: string; text?: string; [key: string]: unknown }

/**
 * A finished AG-UI message. `metadata.runId`, when the host sets it, says
 * which run the message belongs to.
 */
export type AGUIMessage =
  | { id: string; role: "user"; content: string | AGUIContentPart[]; metadata?: unknown }
  | { id: string; role: "assistant"; content?: string; toolCalls?: AGUIToolCall[]; metadata?: unknown }
  | { id: string; role: "reasoning"; content: string; metadata?: unknown }
  | { id: string; role: "tool"; content: string; toolCallId: string; error?: string; metadata?: unknown }
  | { id: string; role: "system" | "developer"; content: string; metadata?: unknown }

/** The AG-UI events the thread draws. Times are milliseconds. */
export type AGUIEvent =
  | { type: "RUN_STARTED"; runId: string; threadId?: string; timestamp?: number }
  | { type: "RUN_FINISHED"; runId?: string; threadId?: string; timestamp?: number }
  | { type: "RUN_ERROR"; message: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_START"; messageId: string; role?: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_END"; messageId: string; timestamp?: number }
  | { type: "REASONING_MESSAGE_START"; messageId: string; timestamp?: number }
  | { type: "REASONING_MESSAGE_CONTENT"; messageId: string; delta: string; timestamp?: number }
  | { type: "REASONING_MESSAGE_END"; messageId: string; timestamp?: number }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string; parentMessageId?: string; timestamp?: number }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string; timestamp?: number }
  | { type: "TOOL_CALL_END"; toolCallId: string; timestamp?: number }
  | { type: "TOOL_CALL_RESULT"; toolCallId: string; content: string; messageId?: string; timestamp?: number }
  | { type: "MESSAGES_SNAPSHOT"; messages: AGUIMessage[]; timestamp?: number }
  | { type: "CUSTOM"; name: string; value?: unknown; timestamp?: number }

/** What a tool call is doing, in words: the value of a CUSTOM "tool.activity" event. */
export type AGUIToolActivity = {
  toolCallId: string
  activity?: string
  activityDone?: string
  labelKeys?: string[]
}

/** The CUSTOM event name for a tool call's words. */
export const TOOL_ACTIVITY_EVENT = "tool.activity"

/** A CUSTOM "tool.output" event's value: what the tool has so far. */
export type AGUIToolOutput = {
  toolCallId: string
  output: string
}

/** The CUSTOM event name for a running tool's output. */
export const TOOL_OUTPUT_EVENT = "tool.output"

/** Any other event (steps, state, custom): passed in freely, ignored. */
export type OtherAGUIEvent = { type: string; [key: string]: unknown }

/** One streaming event. Returns the same array when the event changes nothing. */
export function applyAGUIEvent(messages: ThreadMessage[], event: AGUIEvent | OtherAGUIEvent, runId?: string): ThreadMessage[] {
  const known = event as AGUIEvent
  const time = known.timestamp ?? Date.now()

  switch (known.type) {
    case "RUN_STARTED":
      return updateTurn(messages, runId ?? known.runId, (turn) => {
        return { ...turn, status: "streaming", startedAt: turn.startedAt ?? time }
      })

    case "RUN_FINISHED":
      return updateTurn(messages, runId ?? known.runId, (turn) => {
        const closed = closeTools(closeReasoning(turn, time), time)
        return { ...closed, status: "done", ...durationOf(turn, time) }
      })

    case "RUN_ERROR":
      return updateTurn(messages, runId, (turn) => {
        const closed = closeTools(closeReasoning(turn, time), time)
        const withError = upsertPart(closed, { type: "error", id: `${turn.id}:error`, text: known.message })
        return { ...withError, status: "error", ...durationOf(turn, time) }
      })

    case "TEXT_MESSAGE_START":
      return updateTurn(messages, runId, (turn) => {
        const closed = closeReasoning(turn, time)
        if (findPart(closed, known.messageId)) {
          return closed
        }
        return upsertPart(closed, { type: "text", id: known.messageId, text: "" })
      })

    case "TEXT_MESSAGE_CONTENT":
      return updateTurn(messages, runId, (turn) => {
        const part = findPart(turn, known.messageId)
        let text = known.delta
        if (part?.type === "text") {
          text = part.text + known.delta
        }
        return upsertPart(turn, { type: "text", id: known.messageId, text })
      })

    case "REASONING_MESSAGE_START":
      return updateTurn(messages, runId, (turn) => {
        if (findPart(turn, known.messageId)) {
          return turn
        }
        return upsertPart(turn, { type: "reasoning", id: known.messageId, text: "", streaming: true, startedAt: time })
      })

    case "REASONING_MESSAGE_CONTENT":
      return updateTurn(messages, runId, (turn) => {
        const part = findPart(turn, known.messageId)
        if (part?.type === "reasoning") {
          return upsertPart(turn, { ...part, text: part.text + known.delta })
        }
        return upsertPart(turn, { type: "reasoning", id: known.messageId, text: known.delta, streaming: true, startedAt: time })
      })

    case "REASONING_MESSAGE_END":
      return updateTurn(messages, runId, (turn) => {
        const part = findPart(turn, known.messageId)
        if (part?.type !== "reasoning") {
          return turn
        }
        return upsertPart(turn, { ...part, streaming: false, endedAt: time })
      })

    case "TOOL_CALL_START":
      return updateTurn(messages, runId, (turn) => {
        const closed = closeReasoning(turn, time)
        if (findPart(closed, known.toolCallId)) {
          return closed
        }
        return upsertPart(closed, { type: "tool", id: known.toolCallId, name: known.toolCallName, status: "running", startedAt: time })
      })

    case "TOOL_CALL_ARGS":
      // The arguments arrive as pieces of a JSON string; they're kept as a
      // string until TOOL_CALL_END, then parsed.
      return updateTool(messages, runId, known.toolCallId, (part) => {
        let soFar = ""
        if (typeof part.input === "string") {
          soFar = part.input
        }
        return { ...part, input: soFar + known.delta }
      })

    case "TOOL_CALL_END":
      return updateTool(messages, runId, known.toolCallId, (part) => {
        return { ...part, input: parseArguments(part.input) }
      })

    case "TOOL_CALL_RESULT":
      return updateTool(messages, runId, known.toolCallId, (part) => {
        return { ...part, input: parseArguments(part.input), output: known.content, status: "done", endedAt: time }
      })

    case "MESSAGES_SNAPSHOT":
      return messagesFromAGUI(known.messages)

    case "CUSTOM": {
      if (known.name === TOOL_OUTPUT_EVENT) {
        const live = toolOutputOf(known.value)
        if (!live) {
          return messages
        }
        return updateTool(messages, runId, live.toolCallId, (part) => withLiveOutput(part, live.output))
      }
      if (known.name !== TOOL_ACTIVITY_EVENT) {
        return messages
      }
      const activity = toolActivityOf(known.value)
      if (!activity) {
        return messages
      }
      return updateTool(messages, runId, activity.toolCallId, (part) => withActivity(part, activity))
    }

    default:
      return messages
  }
}

/**
 * One finished message: your own message, or a block of the reply once it's
 * saved. Adding a message that's already there settles it to this content,
 * so a streamed block and its saved copy never show twice.
 */
export function applyAGUIMessage(messages: ThreadMessage[], message: AGUIMessage, runId?: string): ThreadMessage[] {
  switch (message.role) {
    case "user": {
      const exists = messages.some((item) => item.id === message.id)
      if (exists) {
        return messages
      }
      const user: UserMessage = { id: message.id, role: "user", text: userText(message.content) }
      return [...messages, user]
    }

    case "reasoning":
      return updateTurn(messages, runId, (turn) => {
        const part = findPart(turn, message.id)
        if (part?.type === "reasoning") {
          return upsertPart(turn, { ...part, text: message.content, streaming: false })
        }
        return upsertPart(turn, { type: "reasoning", id: message.id, text: message.content })
      })

    case "assistant":
      return updateTurn(messages, runId, (turn) => {
        let next = turn
        if (message.content) {
          next = upsertPart(next, { type: "text", id: message.id, text: message.content })
        }
        for (const call of message.toolCalls ?? []) {
          const part = findPart(next, call.id)
          let existing: Partial<ToolPart> = {}
          if (part?.type === "tool") {
            existing = part
          }
          const settled: ToolPart = {
            ...existing,
            type: "tool",
            id: call.id,
            name: call.function.name,
            status: existing.status ?? "running",
            input: parseArguments(call.function.arguments),
          }
          // The saved call carries its finished words.
          const words = savedActivityOf(message.metadata, call.id)
          next = upsertPart(next, words ? withActivity(settled, words) : settled)
        }
        return next
      })

    case "tool":
      return updateTool(messages, runId, message.toolCallId, (part) => {
        const endedAt = part.endedAt ?? Date.now()
        if (isRecord(message.metadata) && message.metadata.stopped === true) {
          return { ...part, output: message.content, status: "stopped", endedAt }
        }
        if (message.error) {
          return { ...part, output: message.content, error: message.error, status: "error", endedAt }
        }
        return { ...part, output: message.content, status: "done", endedAt }
      })

    default:
      // System and developer messages are for the model, not the thread.
      return messages
  }
}

/**
 * A whole saved chat. The messages of one reply become one finished turn:
 * grouped by `metadata.runId` when the host sets it, else everything after
 * a user message is that message's reply.
 */
export function messagesFromAGUI(history: AGUIMessage[]): ThreadMessage[] {
  let messages: ThreadMessage[] = []
  // The turn that reply messages go in, when they don't name their run.
  let turnId = "reply"

  for (const message of history) {
    const runId = runIdOf(message)

    if (message.role === "user") {
      messages = applyAGUIMessage(messages, message)
      turnId = runId ?? `${message.id}:reply`
      continue
    }
    messages = applyAGUIMessage(messages, message, runId ?? turnId)
  }

  // Read back from storage: every turn is over, and so is every tool call in it.
  const finished: ThreadMessage[] = []
  for (const message of messages) {
    if (message.role === "assistant") {
      finished.push({ ...closeTools(message, undefined), status: "done" })
    } else {
      finished.push(message)
    }
  }
  return finished
}

/**
 * The thread's messages in React state, with AG-UI going in.
 *
 *   const thread = useAGUIThread()
 *   thread.load(savedMessages)            when the chat opens
 *   thread.apply(event, runId)            for each streaming event
 *   thread.applyMessage(message, runId)   for each finished message
 *   <AgentThread messages={thread.messages} … />
 */
export function useAGUIThread(initial: ThreadMessage[] = []) {
  const [messages, setMessages] = React.useState<ThreadMessage[]>(initial)

  const apply = React.useCallback((event: AGUIEvent | OtherAGUIEvent, runId?: string) => {
    setMessages((current) => applyAGUIEvent(current, event, runId))
  }, [])

  const applyMessage = React.useCallback((message: AGUIMessage, runId?: string) => {
    setMessages((current) => applyAGUIMessage(current, message, runId))
  }, [])

  const load = React.useCallback((history: AGUIMessage[]) => {
    setMessages(messagesFromAGUI(history))
  }, [])

  return { messages, setMessages, apply, applyMessage, load }
}

/** Changes one turn, making it first if it isn't there yet. */
function updateTurn(
  messages: ThreadMessage[],
  runId: string | undefined,
  change: (turn: AssistantMessage) => AssistantMessage,
): ThreadMessage[] {
  const next = [...messages]
  let index = findTurn(messages, runId)

  if (index === -1) {
    const turn: AssistantMessage = { id: runId ?? crypto.randomUUID(), role: "assistant", parts: [], status: "streaming" }
    index = newTurnPlace(messages)
    next.splice(index, 0, turn)
  }

  next[index] = change(next[index] as AssistantMessage)
  return next
}

/** Changes one tool call. Nothing happens if the call isn't in the thread. */
function updateTool(
  messages: ThreadMessage[],
  runId: string | undefined,
  toolCallId: string,
  change: (part: ToolPart) => ToolPart,
): ThreadMessage[] {
  const index = findTurn(messages, runId)
  if (index === -1) {
    return messages
  }

  const turn = messages[index] as AssistantMessage
  const part = findPart(turn, toolCallId)
  if (part?.type !== "tool") {
    return messages
  }

  const next = [...messages]
  next[index] = upsertPart(turn, change(part))
  return next
}

/** Where the event's turn is: by run id, else the last turn still streaming. -1 if none. */
function findTurn(messages: ThreadMessage[], runId: string | undefined): number {
  if (runId !== undefined) {
    return messages.findIndex((message) => message.role === "assistant" && message.id === runId)
  }
  return messages.findLastIndex((message) => message.role === "assistant" && message.status === "streaming")
}

/** A new turn goes at the end, but above messages still waiting for their answer. */
function newTurnPlace(messages: ThreadMessage[]): number {
  let place = messages.length
  while (place > 0) {
    const before = messages[place - 1]
    if (before?.role === "user" && before.pending) {
      place -= 1
    } else {
      break
    }
  }
  return place
}

function findPart(turn: AssistantMessage, id: string): MessagePart | undefined {
  return turn.parts.find((part) => part.id === id)
}

/** Replaces the part with the same id, or adds it at the end. */
function upsertPart(turn: AssistantMessage, part: MessagePart): AssistantMessage {
  const parts = [...turn.parts]
  const index = parts.findIndex((item) => item.id === part.id)

  if (index === -1) {
    parts.push(part)
  } else {
    parts[index] = part
  }
  return { ...turn, parts }
}

/** Ends every thought still open: the agent moved on to text, a tool, or stopped. */
/**
 * A turn is over, but some of its tool calls never got a result: the run was
 * stopped (or broke) while they were being written or run. They'd spin
 * forever, so they settle as stopped.
 */
function closeTools(turn: AssistantMessage, time: number | undefined): AssistantMessage {
  const open = turn.parts.some((part) => part.type === "tool" && part.status === "running")
  if (!open) {
    return turn
  }

  const parts: MessagePart[] = []
  for (const part of turn.parts) {
    if (part.type === "tool" && part.status === "running") {
      const stopped: ToolPart = { ...part, input: parseArguments(part.input), status: "stopped" }
      if (time !== undefined) {
        stopped.endedAt = time
      }
      parts.push(stopped)
    } else {
      parts.push(part)
    }
  }
  return { ...turn, parts }
}

function closeReasoning(turn: AssistantMessage, time: number): AssistantMessage {
  const open = turn.parts.some((part) => part.type === "reasoning" && part.streaming)
  if (!open) {
    return turn
  }

  const parts: MessagePart[] = []
  for (const part of turn.parts) {
    if (part.type === "reasoning" && part.streaming) {
      parts.push({ ...part, streaming: false, endedAt: time })
    } else {
      parts.push(part)
    }
  }
  return { ...turn, parts }
}

function durationOf(turn: AssistantMessage, time: number): { durationMs?: number } {
  if (turn.startedAt === undefined) {
    return {}
  }
  return { durationMs: time - turn.startedAt }
}

/** A tool call with its words: whichever the host sent, over what it had. Empty words are no words. */
function withActivity(part: ToolPart, words: Omit<AGUIToolActivity, "toolCallId">): ToolPart {
  const next: ToolPart = { ...part }
  if (words.activity) {
    next.activity = words.activity
  }
  if (words.activityDone) {
    next.activityDone = words.activityDone
  }
  if (words.labelKeys) {
    next.labelKeys = words.labelKeys
  }
  return next
}

/** A CUSTOM "tool.activity" event's value, if it is one. */
function toolActivityOf(value: unknown): AGUIToolActivity | undefined {
  if (!isRecord(value) || typeof value.toolCallId !== "string") {
    return undefined
  }
  return {
    toolCallId: value.toolCallId,
    ...wordsOf(value),
  }
}

/** What a running tool has so far. Once it has its result, late output changes nothing. */
function withLiveOutput(part: ToolPart, output: string): ToolPart {
  if (part.status !== "running") {
    return part
  }
  return { ...part, output }
}

/** A CUSTOM "tool.output" event's value, if it is one. */
function toolOutputOf(value: unknown): AGUIToolOutput | undefined {
  if (!isRecord(value) || typeof value.toolCallId !== "string" || typeof value.output !== "string") {
    return undefined
  }
  return { toolCallId: value.toolCallId, output: value.output }
}

/** A saved call's words, from its message's `metadata.toolActivity`. */
function savedActivityOf(metadata: unknown, toolCallId: string): Omit<AGUIToolActivity, "toolCallId"> | undefined {
  if (!isRecord(metadata) || !isRecord(metadata.toolActivity)) {
    return undefined
  }
  const words = metadata.toolActivity[toolCallId]
  if (!isRecord(words)) {
    return undefined
  }
  return wordsOf(words)
}

function wordsOf(value: Record<string, unknown>): Omit<AGUIToolActivity, "toolCallId"> {
  const words: Omit<AGUIToolActivity, "toolCallId"> = {}
  if (typeof value.activity === "string") {
    words.activity = value.activity
  }
  if (typeof value.activityDone === "string") {
    words.activityDone = value.activityDone
  }
  if (Array.isArray(value.labelKeys)) {
    words.labelKeys = value.labelKeys.filter((key): key is string => typeof key === "string")
  }
  return words
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Tool arguments as an object when they're JSON, else as they came. */
function parseArguments(input: unknown): unknown {
  if (typeof input !== "string") {
    return input
  }
  try {
    return JSON.parse(input)
  } catch {
    return input
  }
}

function userText(content: string | AGUIContentPart[]): string {
  if (typeof content === "string") {
    return content
  }

  const texts: string[] = []
  for (const part of content) {
    if (part.type === "text" && typeof part.text === "string") {
      texts.push(part.text)
    }
  }
  return texts.join("\n\n")
}

function runIdOf(message: AGUIMessage): string | undefined {
  const metadata = message.metadata
  if (typeof metadata !== "object" || metadata === null) {
    return undefined
  }
  const runId = (metadata as { runId?: unknown }).runId
  if (typeof runId === "string") {
    return runId
  }
  return undefined
}

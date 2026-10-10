/**
 * The AG-UI adapter: AG-UI events and messages in, the thread's messages out.
 */
import { describe, expect, it } from "vitest"
import { type AGUIEvent, type AGUIMessage, applyAGUIEvent, applyAGUIMessage, messagesFromAGUI } from "../src/thread/ag-ui"
import type { AssistantMessage, ThreadMessage } from "../src/thread/types"

function applyAll(events: AGUIEvent[], runId?: string, start: ThreadMessage[] = []): ThreadMessage[] {
  let messages = start
  for (const event of events) {
    messages = applyAGUIEvent(messages, event, runId)
  }
  return messages
}

function onlyTurn(messages: ThreadMessage[]): AssistantMessage {
  const turns = messages.filter((message) => message.role === "assistant")
  expect(turns).toHaveLength(1)
  return turns[0] as AssistantMessage
}

describe("applyAGUIEvent", () => {
  it("builds one turn from a run's thinking and text", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1", timestamp: 1000 },
      { type: "REASONING_MESSAGE_START", messageId: "r1", timestamp: 1000 },
      { type: "REASONING_MESSAGE_CONTENT", messageId: "r1", delta: "They said " },
      { type: "REASONING_MESSAGE_CONTENT", messageId: "r1", delta: "hi." },
      { type: "REASONING_MESSAGE_END", messageId: "r1", timestamp: 2000 },
      { type: "TEXT_MESSAGE_START", messageId: "a1", role: "assistant", timestamp: 2000 },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: "Hello" },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: "!" },
      { type: "TEXT_MESSAGE_END", messageId: "a1" },
      { type: "RUN_FINISHED", runId: "run-1", timestamp: 3000 },
    ])

    const turn = onlyTurn(messages)
    expect(turn).toMatchObject({ id: "run-1", status: "done", startedAt: 1000, durationMs: 2000 })
    expect(turn.parts).toMatchObject([
      { type: "reasoning", id: "r1", text: "They said hi.", streaming: false, endedAt: 2000 },
      { type: "text", id: "a1", text: "Hello!" },
    ])
  })

  it("is streaming until the run finishes", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1" },
      { type: "TEXT_MESSAGE_START", messageId: "a1" },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: "Hel" },
    ])

    expect(onlyTurn(messages).status).toBe("streaming")
  })

  it("puts each delta in its own message by id, even when they arrive mixed", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1" },
      { type: "REASONING_MESSAGE_START", messageId: "r1" },
      { type: "TEXT_MESSAGE_START", messageId: "a1" },
      { type: "REASONING_MESSAGE_CONTENT", messageId: "r1", delta: "think" },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: "say" },
      { type: "REASONING_MESSAGE_CONTENT", messageId: "r1", delta: "ing" },
    ])

    expect(onlyTurn(messages).parts).toMatchObject([
      { id: "r1", text: "thinking" },
      { id: "a1", text: "say" },
    ])
  })

  it("puts events in the turn the host names, without needing RUN_STARTED", () => {
    const messages = applyAll(
      [
        { type: "TEXT_MESSAGE_START", messageId: "a1" },
        { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: "Hi" },
      ],
      "run-7",
    )

    expect(onlyTurn(messages)).toMatchObject({ id: "run-7", parts: [{ id: "a1", text: "Hi" }] })
  })

  it("shows a failed run with its error", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1" },
      { type: "RUN_ERROR", message: "Overloaded" },
    ])

    const turn = onlyTurn(messages)
    expect(turn.status).toBe("error")
    expect(turn.parts).toMatchObject([{ type: "error", text: "Overloaded" }])
  })

  it("builds a tool call from its streamed arguments and its result", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1", timestamp: 1000 },
      { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "read_file", timestamp: 1000 },
      { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"path":' },
      { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '"a.ts"}' },
      { type: "TOOL_CALL_END", toolCallId: "c1" },
      { type: "TOOL_CALL_RESULT", toolCallId: "c1", content: "export {}", timestamp: 2500 },
    ])

    expect(onlyTurn(messages).parts).toMatchObject([
      {
        type: "tool",
        id: "c1",
        name: "read_file",
        status: "done",
        input: { path: "a.ts" },
        output: "export {}",
        startedAt: 1000,
        endedAt: 2500,
      },
    ])
  })

  it("puts a new turn above messages still waiting for their answer", () => {
    const waiting: ThreadMessage[] = [
      { id: "u1", role: "user", text: "one" },
      { id: "u2", role: "user", text: "two", pending: true },
    ]

    const messages = applyAll([{ type: "RUN_STARTED", runId: "run-1" }], undefined, waiting)

    expect(messages.map((message) => message.id)).toEqual(["u1", "run-1", "u2"])
  })

  it("ignores events it doesn't draw", () => {
    const before = applyAll([{ type: "RUN_STARTED", runId: "run-1" }])

    const after = applyAGUIEvent(before, { type: "STEP_STARTED", stepName: "plan" })

    expect(after).toBe(before)
  })
})

describe("applyAGUIMessage", () => {
  it("adds your message, once", () => {
    const message: AGUIMessage = { id: "u1", role: "user", content: "hi" }

    let messages = applyAGUIMessage([], message)
    messages = applyAGUIMessage(messages, message)

    expect(messages).toEqual([{ id: "u1", role: "user", text: "hi" }])
  })

  it("settles a streamed message to its saved content, without adding it twice", () => {
    const streamed = applyAll([
      { type: "RUN_STARTED", runId: "run-1" },
      { type: "TEXT_MESSAGE_START", messageId: "a1" },
      { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: "Hel" },
    ])

    const settled = applyAGUIMessage(streamed, { id: "a1", role: "assistant", content: "Hello!" }, "run-1")

    expect(onlyTurn(settled).parts).toMatchObject([{ id: "a1", text: "Hello!" }])
  })
})

describe("tool calls that never finish", () => {
  it("settles a tool call still running when its run ends as stopped", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1", timestamp: 1000 },
      { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "read_file", timestamp: 1000 },
      { type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: '{"path":"a.t' },
      { type: "RUN_FINISHED", runId: "run-1", timestamp: 2000 },
    ])

    expect(onlyTurn(messages).parts).toMatchObject([
      // The arguments stay as far as they got; the row reads cut-off JSON itself.
      { type: "tool", id: "c1", status: "error", error: "Stopped before it finished.", input: '{"path":"a.t', endedAt: 2000 },
    ])
  })

  it("settles it the same way when the run fails", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1", timestamp: 1000 },
      { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "read_file", timestamp: 1000 },
      { type: "RUN_ERROR", message: "The model is down", timestamp: 2000 },
    ], "run-1")

    expect(onlyTurn(messages).parts[0]).toMatchObject({ type: "tool", status: "error", error: "Stopped before it finished." })
  })

  it("leaves finished tool calls as they are", () => {
    const messages = applyAll([
      { type: "RUN_STARTED", runId: "run-1", timestamp: 1000 },
      { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "read_file", timestamp: 1000 },
      { type: "TOOL_CALL_RESULT", toolCallId: "c1", content: "export {}", timestamp: 1500 },
      { type: "RUN_FINISHED", runId: "run-1", timestamp: 2000 },
    ])

    expect(onlyTurn(messages).parts[0]).toMatchObject({ status: "done", output: "export {}", endedAt: 1500 })
  })

  it("shows a saved call without a result as stopped, not running", () => {
    const messages = messagesFromAGUI([
      { id: "u1", role: "user", content: "read a.ts" },
      {
        id: "a1",
        role: "assistant",
        toolCalls: [{ id: "c1", type: "function", function: { name: "read_file", arguments: '{"path":"a.ts"}' } }],
      },
    ])

    expect(messages[1]).toMatchObject({
      status: "done",
      parts: [{ type: "tool", id: "c1", status: "error", error: "Stopped before it finished.", input: { path: "a.ts" } }],
    })
  })

  it("settles a call when its saved result arrives, with when it ended", () => {
    const started = applyAll([
      { type: "RUN_STARTED", runId: "run-1", timestamp: 1000 },
      { type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "clock", timestamp: 1000 },
    ])
    const messages = applyAGUIMessage(started, { id: "m1", role: "tool", toolCallId: "c1", content: "9:00" }, "run-1")

    const part = onlyTurn(messages).parts[0]
    expect(part).toMatchObject({ status: "done", output: "9:00" })
    expect(part?.type === "tool" ? part.endedAt : undefined).toEqual(expect.any(Number))
  })
})

describe("messagesFromAGUI", () => {
  it("turns a saved chat into the thread: each reply's messages become one finished turn", () => {
    const messages = messagesFromAGUI([
      { id: "u1", role: "user", content: "2 + 2?" },
      { id: "r1", role: "reasoning", content: "Easy." },
      { id: "a1", role: "assistant", content: "4." },
      { id: "u2", role: "user", content: "And 3 + 3?" },
      { id: "a2", role: "assistant", content: "6." },
    ])

    expect(messages.map((message) => message.role)).toEqual(["user", "assistant", "user", "assistant"])
    expect(messages[1]).toMatchObject({ status: "done", parts: [{ id: "r1" }, { id: "a1" }] })
    expect(messages[3]).toMatchObject({ status: "done", parts: [{ id: "a2", text: "6." }] })
  })

  it("groups a run's messages by metadata.runId when the host provides it", () => {
    const messages = messagesFromAGUI([
      { id: "u1", role: "user", content: "hi", metadata: { runId: "run-1" } },
      { id: "a1", role: "assistant", content: "Hello!", metadata: { runId: "run-1" } },
    ])

    expect(messages[1]).toMatchObject({ id: "run-1", role: "assistant" })
  })
})

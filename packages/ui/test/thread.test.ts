import { describe, expect, it } from "vitest"
import { fromAISDK } from "../src/thread/ai-sdk"
import { splitTurn } from "../src/thread/messages"
import { reduceThreadBatch, type ThreadEvent } from "../src/thread/reduce"
import { inferTool, resolveTool } from "../src/thread/tools"
import type { AssistantMessage } from "../src/thread/types"

const turn = (events: ThreadEvent[]) => reduceThreadBatch([], events)

describe("reduceThread", () => {
  it("builds a turn from streamed events", () => {
    const messages = turn([
      { type: "user", id: "u", text: "hi", at: 0 },
      { type: "turn-start", id: "a", at: 1000 },
      { type: "reasoning-start", id: "a", at: 1000 },
      { type: "reasoning-delta", id: "a", delta: "**Plan**" },
      { type: "tool-start", id: "a", callId: "c", name: "read_file", input: { path: "a.ts" }, at: 2000 },
      { type: "tool-end", id: "a", callId: "c", output: "ok", at: 3000 },
      { type: "reply-start", id: "a", at: 4000 },
      { type: "text-delta", id: "a", delta: "Done" },
      { type: "text-delta", id: "a", delta: "." },
      { type: "turn-end", id: "a", at: 5000 },
    ])
    expect(messages).toHaveLength(2)
    const reply = messages[1] as AssistantMessage
    expect(reply.status).toBe("done")
    expect(reply.parts.map((part) => part.type)).toEqual(["reasoning", "tool", "text"])
    expect(reply.parts[0]).toMatchObject({ streaming: false, endedAt: 2000 })
    expect(reply.parts[1]).toMatchObject({ status: "done", startedAt: 2000, endedAt: 3000 })
    expect(reply.parts[2]).toMatchObject({ text: "Done." })
    expect(reply.replyFrom).toBe(2)
    expect(reply.durationMs).toBe(3000)
  })

  it("settles running tools and marks errors", () => {
    const [a] = turn([
      { type: "tool-start", id: "a", callId: "c1", name: "bash" },
      { type: "tool-start", id: "a", callId: "c2", name: "bash" },
      { type: "tool-end", id: "a", callId: "c2", error: "exit 1" },
      { type: "turn-end", id: "a" },
    ]) as [AssistantMessage]
    expect(a.parts[0]).toMatchObject({ status: "done" })
    expect(a.parts[1]).toMatchObject({ status: "error", error: "exit 1" })
  })
})

describe("splitTurn", () => {
  it("treats the trailing text as the reply when replyFrom is missing", () => {
    const message: AssistantMessage = {
      id: "a",
      role: "assistant",
      parts: [
        { type: "text", id: "1", text: "Looking" },
        { type: "tool", id: "2", name: "grep", status: "done" },
        { type: "text", id: "3", text: "Found it" },
      ],
    }
    const { work, reply } = splitTurn(message)
    expect(work.map((part) => part.id)).toEqual(["1", "2"])
    expect(reply.map((part) => part.id)).toEqual(["3"])
  })

  it("keeps finished steps and cards after the last text with the reply, once the turn is over", () => {
    const parts: AssistantMessage["parts"] = [
      { type: "tool", id: "1", name: "search", status: "done" },
      { type: "text", id: "2", text: "You missed one step." },
      { type: "tool", id: "3", name: "save_note", status: "done" },
      { type: "custom", id: "4", kind: "verdict" },
    ]
    const settled = splitTurn({ id: "a", role: "assistant", parts })
    expect(settled.work.map((part) => part.id)).toEqual(["1"])
    expect(settled.reply.map((part) => part.id)).toEqual(["2", "3", "4"])

    // While it streams, a step after the text may lead to more work: nothing is the reply yet.
    const live = splitTurn({ id: "a", role: "assistant", parts, status: "streaming" })
    expect(live.reply).toEqual([])
  })

  it("never counts a running step as part of the reply", () => {
    const { reply } = splitTurn({
      id: "a",
      role: "assistant",
      parts: [
        { type: "text", id: "1", text: "Checking" },
        { type: "tool", id: "2", name: "grep", status: "running" },
      ],
    })
    expect(reply).toEqual([])
  })
})

describe("tools", () => {
  it("infers marks and verbs from names, including MCP prefixes", () => {
    expect(inferTool("read_file").verb).toEqual(["Reading", "Read"])
    expect(inferTool("web-search").verb[1]).toBe("Searched the web")
    expect(inferTool("mcp__github__create_file").verb[1]).toBe("Wrote")
  })

  it("prefers the registry, then the part, then inference", () => {
    const part = { type: "tool" as const, id: "t", name: "deploy", status: "done" as const, input: { target: "prod" } }
    expect(resolveTool(part, {}).title).toBe("Deploy")
    expect(resolveTool(part, { deploy: { title: "Shipped", subject: ({ input }) => (input as { target: string }).target } })).toMatchObject({
      title: "Shipped",
      subject: "prod",
    })
    expect(resolveTool({ ...part, name: "read_file", input: { path: "src/a.ts" } }, {}).subject).toBe("src/a.ts")
  })
})

describe("fromAISDK", () => {
  it("maps text, reasoning and tool parts", () => {
    const [user, reply] = fromAISDK(
      [
        { id: "u", role: "user", parts: [{ type: "text", text: "weather?" }] },
        {
          id: "a",
          role: "assistant",
          parts: [
            { type: "reasoning", text: "thinking", state: "done" },
            { type: "tool-getWeather", toolCallId: "c", state: "output-available", input: { city: "Oslo" }, output: { temp: 3 } },
            { type: "text", text: "3°" },
          ],
        },
      ],
      "ready",
    )
    expect(user).toMatchObject({ role: "user", text: "weather?" })
    expect((reply as AssistantMessage).parts).toMatchObject([
      { type: "reasoning", streaming: false },
      { type: "tool", name: "getWeather", status: "done", output: { temp: 3 } },
      { type: "text", text: "3°" },
    ])
  })

  it("adds a pending turn while submitted", () => {
    const messages = fromAISDK([{ id: "u", role: "user", parts: [{ type: "text", text: "hi" }] }], "submitted")
    expect(messages.at(-1)).toMatchObject({ role: "assistant", status: "streaming", parts: [] })
  })
})

describe("markdown images", () => {
  it("parses an image line from any source, and the default policy loads only https", async () => {
    const { parse } = await import("../src/thread/markdownBlocks")
    const { httpsImages } = await import("../src/thread/config")
    expect(parse("![dot](http://localhost:3000/api/media/1?sig=x)")).toEqual([
      { kind: "image", alt: "dot", src: "http://localhost:3000/api/media/1?sig=x" },
    ])
    expect(httpsImages("https://example.com/a.png")).toBe("https://example.com/a.png")
    expect(httpsImages("http://localhost:3000/a.png")).toBeNull()
    expect(httpsImages("file:///etc/passwd")).toBeNull()
  })
})

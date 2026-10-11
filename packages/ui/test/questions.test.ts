import { describe, expect, it } from "vitest"
import { answersFromText, fromAISDK } from "../src/thread/ai-sdk"
import { groupParts, isOutcome } from "../src/thread/group"
import { formatQuestionAnswers, questionExchange } from "../src/thread/question-exchange"
import { reduceThreadBatch } from "../src/thread/reduce"
import { parseReference } from "../src/thread/references"
import { plainMath } from "../src/thread/tex"
import { closeOff } from "../src/thread/tools"
import type { AssistantMessage, MessagePart, Question } from "../src/thread/types"

const questions: Question[] = [
  { header: "Scope", question: "How much?", options: [{ label: "All" }, { label: "Some" }] },
  { header: "Format", question: "Which format?", options: [{ label: "CSV" }, { label: "JSON" }], multiple: true },
]

describe("questions", () => {
  it("round-trips answers through the agent's text", () => {
    const answers = [{ selected: ["Some"] }, { selected: ["CSV", "JSON"] }]
    const text = formatQuestionAnswers(questions, answers)
    expect(text).toBe("Scope: Some\nFormat: CSV, JSON")
    expect(questionExchange({ questions }, text).map((item) => item.answer)).toEqual(["Some", "CSV, JSON"])
    expect(answersFromText(questions, text)).toEqual(answers)
    expect(answersFromText(questions, "Scope: just the first\nFormat: CSV")).toEqual([{ selected: [], custom: "just the first" }, { selected: ["CSV"] }])
  })

  it("reads a cancelled call as no exchange", () => {
    expect(questionExchange({ questions }, { status: "cancelled" })).toEqual([])
  })

  it("adds, answers and cancels question parts", () => {
    const asked = reduceThreadBatch([], [
      { type: "turn-start", id: "a", at: 0 },
      { type: "question", id: "a", partId: "q1", questions },
    ])
    expect((asked[0] as AssistantMessage).parts[0]).toMatchObject({ type: "question", status: "pending" })
    const answered = reduceThreadBatch(asked, [{ type: "question-answer", partId: "q1", answers: [{ selected: ["All"] }, { selected: ["CSV"] }] }])
    const part = (answered[0] as AssistantMessage).parts[0]!
    expect(part).toMatchObject({ status: "answered", answers: [{ selected: ["All"] }, { selected: ["CSV"] }] })
    expect(isOutcome(part)).toBe(true)
    const cancelled = reduceThreadBatch(asked, [{ type: "question-cancel", partId: "q1" }])
    expect((cancelled[0] as AssistantMessage).parts[0]).toMatchObject({ status: "cancelled" })
  })

  it("maps AI SDK ask tools and image files", () => {
    const [user, reply] = fromAISDK([
      { id: "u", role: "user", parts: [{ type: "text", text: "look" }, { type: "file", mediaType: "image/png", url: "data:x", filename: "a.png" }] },
      { id: "a", role: "assistant", parts: [{ type: "tool-ask_user", toolCallId: "t", state: "input-available", input: { questions } }] },
    ])
    expect(user).toMatchObject({ attachments: [{ url: "data:x", name: "a.png", mimeType: "image/png" }] })
    expect((reply as AssistantMessage).parts[0]).toMatchObject({ type: "question", id: "t", status: "pending" })
  })
})

describe("groupParts", () => {
  it("joins thinking, and keeps it as its own row before the call", () => {
    const parts: MessagePart[] = [
      { type: "reasoning", id: "r1", text: "**A**" },
      { type: "reasoning", id: "r2", text: "**B**" },
      { type: "status", id: "s", text: "Preparing read file" },
      { type: "tool", id: "t", name: "read_file", status: "done" },
      { type: "reasoning", id: "r3", text: "after" },
      { type: "text", id: "x", text: "Answer" },
    ]
    const rows = groupParts(parts)
    expect(rows.map((row) => row.part.id)).toEqual(["r1", "t", "r3", "x"])
    expect(rows[0]!.part).toMatchObject({ type: "reasoning", text: "**A**\n\n**B**" })
  })

  it("keeps streaming thought as its own row", () => {
    const rows = groupParts([
      { type: "reasoning", id: "r", text: "…", streaming: true },
      { type: "tool", id: "t", name: "x", status: "running" },
    ])
    expect(rows).toHaveLength(2)
  })
})

describe("helpers", () => {
  it("closes truncated JSON", () => {
    expect(JSON.parse(closeOff('{"a":[1,2],"b":{"c":1},"d":"unfin'))).toEqual({ a: [1, 2], b: { c: 1 } })
  })
  it("draws TeX as characters", () => {
    expect(plainMath("cost \\(O(n^2)\\) and \\(a \\le b\\)")).toBe("cost O(n²) and a ≤ b")
  })
  it("parses references", () => {
    expect(parseReference("[[file:src/a.ts|a.ts]]")).toEqual({ kind: "file", target: "src/a.ts", label: "a.ts" })
    expect(parseReference("[[doc:intro]]")).toEqual({ kind: "doc", target: "intro", label: "intro" })
  })
})

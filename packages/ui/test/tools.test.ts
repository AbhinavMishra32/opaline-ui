/**
 * How a tool row reads: its title, what it's about, and the input it shows.
 */
import { describe, expect, it } from "vitest"
import { formatPayload, parseMaybeJson, resolveTool } from "../src/thread/tools"
import type { ToolPart } from "../src/thread/types"

function call(fields: Partial<ToolPart>): ToolPart {
  return { type: "tool", id: "c1", name: "shell", status: "running", ...fields }
}

describe("resolveTool with the host's words", () => {
  it("shows what the call is doing while it runs", () => {
    const tool = resolveTool(call({ activity: "Finding your chat model files", activityDone: "Found your chat model files" }), {})

    expect(tool.title).toBe("Finding your chat model files")
    expect(tool.subject).toBeUndefined()
  })

  it("shows what it did once it worked", () => {
    const tool = resolveTool(call({ status: "done", activity: "Finding your files", activityDone: "Found your files" }), {})

    expect(tool.title).toBe("Found your files")
  })

  it("keeps saying what it was doing when it failed", () => {
    const tool = resolveTool(call({ status: "error", activity: "Finding your files", activityDone: "Found your files" }), {})

    expect(tool.title).toBe("Finding your files")
  })

  it("falls back to what it was doing when there are no finished words", () => {
    const tool = resolveTool(call({ status: "done", activity: "Finding your files" }), {})

    expect(tool.title).toBe("Finding your files")
  })

  it("wins over the registry's title", () => {
    const tool = resolveTool(call({ activity: "Checking the login form" }), { shell: { title: "Running" } })

    expect(tool.title).toBe("Checking the login form")
  })

  it("falls back to the tool's name without words", () => {
    const tool = resolveTool(call({}), {})

    expect(tool.title).not.toBe("")
  })

  it("leaves the words-arguments out of the input, even half-written", () => {
    const saved = resolveTool(call({ input: { activity: "Listing", command: "ls" }, labelKeys: ["activity", "activity_done"] }), {})
    const streaming = resolveTool(call({ input: '{"activity":"Listing files","command":"l', labelKeys: ["activity", "activity_done"] }), {})

    expect(saved.props.input).toEqual({ command: "ls" })
    expect(streaming.props.input).toEqual({ command: "l" })
  })
})

describe("parseMaybeJson on arguments still being written", () => {
  it("closes an open string and object", () => {
    expect(parseMaybeJson('{"command":"npm te')).toEqual({ command: "npm te" })
  })

  it("steps back over a key cut in half", () => {
    expect(parseMaybeJson('{"path":"a.ts","comm')).toEqual({ path: "a.ts" })
  })

  it("keeps escapes intact", () => {
    expect(parseMaybeJson('{"code":"say(\\"hi')).toEqual({ code: 'say("hi' })
  })

  it("leaves what isn't JSON alone", () => {
    expect(parseMaybeJson("plain text")).toBe("plain text")
  })
})

describe("formatPayload", () => {
  it("shows nothing for no arguments", () => {
    expect(formatPayload({})).toBe("")
    expect(formatPayload("{}")).toBe("")
    expect(formatPayload([])).toBe("")
  })

  it("pretty-prints the rest", () => {
    expect(formatPayload('{"path":"a.ts"}')).toBe('{\n  "path": "a.ts"\n}')
  })
})


describe("resolveTool with live output", () => {
  it("shows the latest line beside the title while it runs", () => {
    const tool = resolveTool(call({ activity: "Counting down from 10", output: "10\n9\n8\n" }), {})

    expect(tool.detail).toBe("8")
  })

  it("stops showing it once the call is done", () => {
    const tool = resolveTool(call({ status: "done", activity: "Counting down", activityDone: "Counted down", output: "3\n2\n1\nDone." }), {})

    expect(tool.detail).toBeUndefined()
  })
})

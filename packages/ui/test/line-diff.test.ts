import { describe, expect, it } from "vitest"
import { diffCounts, lineDiff, wordDiff } from "../src/lib/line-diff"

describe("lineDiff", () => {
  it("marks every line added when there was nothing before", () => {
    expect(lineDiff(null, "a\nb")).toEqual([
      { kind: "added", text: "a" },
      { kind: "added", text: "b" },
    ])
  })

  it("keeps common lines and marks an edit as a removal and an addition", () => {
    const diff = lineDiff("# Notes\nlikes hints\nstruggles with recursion\n", "# Notes\nprefers no hints\nstruggles with recursion")
    expect(diff).toEqual([
      { kind: "same", text: "# Notes" },
      { kind: "removed", text: "likes hints" },
      { kind: "added", text: "prefers no hints" },
      { kind: "same", text: "struggles with recursion" },
    ])
    expect(diffCounts(diff)).toEqual({ added: 1, removed: 1 })
  })

  it("finds an insertion in the middle without disturbing the lines around it", () => {
    expect(lineDiff("a\nb\nc", "a\nb\nx\nc").map((line) => line.kind)).toEqual(["same", "same", "added", "same"])
  })

  it("treats identical texts as unchanged", () => {
    expect(diffCounts(lineDiff("a\r\nb", "a\nb"))).toEqual({ added: 0, removed: 0 })
  })
})

describe("wordDiff", () => {
  it("marks only the words that changed on an edited line", () => {
    const diff = wordDiff(lineDiff("- Lives in Berlin.", "- Lives in Munich."))
    const removed = diff.find((line) => line.kind === "removed")!
    const added = diff.find((line) => line.kind === "added")!
    expect(removed.spans?.filter((span) => span.changed).map((span) => span.text)).toEqual(["Berlin"])
    expect(added.spans?.filter((span) => span.changed).map((span) => span.text)).toEqual(["Munich"])
  })

  it("leaves a rewrite as whole lines", () => {
    const diff = wordDiff(lineDiff("Apples.", "The weather is nice today."))
    expect(diff.every((line) => line.spans === undefined)).toBe(true)
  })
})

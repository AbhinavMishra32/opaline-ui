/**
 * A line diff between two texts, by longest common subsequence, with the
 * changed words marked on edited lines (as GitHub draws them).
 *
 *   lineDiff("a\nb", "a\nc")  →  same "a", removed "b", added "c"
 *
 * Small on purpose: it's for pages of prose (notes, documents), not source
 * trees, so an O(n·m) table is a few thousand cells. Ported from Spar.
 */
export type DiffLine = {
  kind: "same" | "added" | "removed"
  text: string
  /**
   * For a changed line paired with its counterpart on the other side: the
   * line in pieces, with the words that actually changed marked, so an edited
   * sentence shows the edit and not just a red line and a green one.
   */
  spans?: DiffSpan[]
}

export type DiffSpan = { text: string; changed: boolean }

function lines(text: string | null | undefined): string[] {
  if (!text) return []
  return text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n")
}

/** table[i][j]: the length of the longest common subsequence of a[i..] and b[j..]. */
function lcsTable(a: string[], b: string[]): Uint32Array[] {
  const table: Uint32Array[] = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) table[i]![j] = table[i + 1]![j + 1]! + 1
      else table[i]![j] = Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
    }
  }
  return table
}

export function lineDiff(before: string | null | undefined, after: string | null | undefined): DiffLine[] {
  const a = lines(before)
  const b = lines(after)
  const table = lcsTable(a, b)

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i]! })
      i += 1
      j += 1
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      out.push({ kind: "removed", text: a[i]! })
      i += 1
    } else {
      out.push({ kind: "added", text: b[j]! })
      j += 1
    }
  }
  while (i < a.length) out.push({ kind: "removed", text: a[i++]! })
  while (j < b.length) out.push({ kind: "added", text: b[j++]! })
  return out
}

/** Words, runs of whitespace and single punctuation marks: the grain an edit to prose happens at. */
function tokens(text: string): string[] {
  return text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? []
}

/** Which tokens of `a` and `b` survive into the other. */
function commonTokens(a: string[], b: string[]): { keepA: boolean[]; keepB: boolean[]; common: number } {
  const table = lcsTable(a, b)
  const keepA = a.map(() => false)
  const keepB = b.map(() => false)
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      keepA[i] = true
      keepB[j] = true
      i += 1
      j += 1
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      i += 1
    } else {
      j += 1
    }
  }
  return { keepA, keepB, common: table[0]?.[0] ?? 0 }
}

function spansOf(parts: string[], keep: boolean[]): DiffSpan[] {
  const out: DiffSpan[] = []
  parts.forEach((text, index) => {
    // Whitespace between two changed words is part of the change; anywhere else it isn't worth a mark.
    const between = /^\s+$/.test(text) && (keep[index - 1] ?? true) && (keep[index + 1] ?? true)
    const changed = !keep[index] && !between
    const tail = out[out.length - 1]
    if (tail && tail.changed === changed) tail.text += text
    else out.push({ text, changed })
  })
  return out
}

/** Below this share of tokens in common, two lines are a rewrite rather than an edit. */
const WORD_DIFF_MIN_SHARED = 0.4

/**
 * The line diff with word-level marks on edited lines. Within each run of
 * changes, the k-th removed line is paired with the k-th added line; a pair
 * that's mostly the same text gets its changed words marked, anything else
 * stays a whole-line change.
 */
export function wordDiff(diff: DiffLine[]): DiffLine[] {
  const out = diff.map((line) => ({ ...line }))
  let index = 0
  while (index < out.length) {
    if (out[index]!.kind === "same") {
      index += 1
      continue
    }
    const removed: DiffLine[] = []
    const added: DiffLine[] = []
    while (index < out.length && out[index]!.kind !== "same") {
      if (out[index]!.kind === "removed") removed.push(out[index]!)
      else added.push(out[index]!)
      index += 1
    }
    for (let k = 0; k < Math.min(removed.length, added.length); k += 1) {
      const a = tokens(removed[k]!.text)
      const b = tokens(added[k]!.text)
      const { keepA, keepB, common } = commonTokens(a, b)
      const meaningful = (parts: string[]) => parts.filter((part) => !/^\s+$/.test(part)).length || 1
      const shared = common / Math.max(meaningful(a), meaningful(b), 1)
      if (shared < WORD_DIFF_MIN_SHARED) continue
      removed[k]!.spans = spansOf(a, keepA)
      added[k]!.spans = spansOf(b, keepB)
    }
  }
  return out
}

export function diffCounts(diff: DiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of diff) {
    if (line.kind === "added") added += 1
    else if (line.kind === "removed") removed += 1
  }
  return { added, removed }
}

/**
 * The text side of `@` mentions in the composer: finding the `@` being typed,
 * the words a picked mention puts in the draft, and the reference markup they
 * stand for when the message is sent.
 *
 * A picked mention lives in the draft as a word — `@main.py` — not as
 * `[[file:src/main.py|main.py]]`: an id in the field wraps, cannot be read,
 * and takes forty keystrokes to delete. The markup is what the message needs,
 * so the composer keeps a token → markup map and swaps them on send
 * (`expandMentions`). Pure functions, so they are tested without a DOM; the
 * picker is `mentions.tsx`.
 */
import type * as React from "react"

/** Something the person can mention. Sent as `[[kind:id|label]]`. */
export type MentionItem = {
  id: string
  kind: string
  label: string
  /** The rest of the row's sentence: "src/main.py", "solved". */
  detail?: string
  icon?: React.ComponentType<{ className?: string }>
  /** A heading the row sits under; a new heading starts where it changes. */
  section?: string
  /** Opens onto these instead of inserting (the item itself is offered first inside). */
  children?: MentionItem[]
}

/** A picked mention: the word in the draft, and the markup it is sent as. */
export type Mention = { token: string; markup: string }

/** Characters that would break the token or the markup it stands for. */
const UNSAFE_IN_LABEL = /[[\]|@\n]/g

export function mentionToken(item: Pick<MentionItem, "id" | "kind" | "label">): Mention {
  const words = item.label.replace(UNSAFE_IN_LABEL, " ").replace(/\s+/g, " ").trim()
  return { token: `@${words}`, markup: `[[${item.kind}:${item.id}|${words}]]` }
}

/** Longest first, so `@Submission 1` cannot claim the front of `@Submission 12`. */
function longestFirst(tokens: Iterable<string>): string[] {
  const sorted = Array.from(tokens)
  sorted.sort((left, right) => right.length - left.length)
  return sorted
}

/** The draft as it is sent: every picked token put back to its markup. */
export function expandMentions(text: string, picked: ReadonlyMap<string, string>): string {
  let expanded = text
  for (const token of longestFirst(picked.keys())) {
    if (!expanded.includes(token)) continue
    expanded = expanded.split(token).join(picked.get(token)!)
  }
  return expanded
}

/**
 * Where the picked tokens are in the draft, so the field can draw them as
 * tags. In order and never overlapping; a token the person has typed over
 * simply stops matching, which is the whole of the editing story.
 */
export function mentionSpans(text: string, tokens: Iterable<string>): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = []
  for (const token of longestFirst(tokens)) {
    let from = 0
    while (true) {
      const start = text.indexOf(token, from)
      if (start === -1) break
      const end = start + token.length
      from = end
      const overlaps = spans.some((span) => start < span.end && end > span.start)
      if (!overlaps) spans.push({ start, end })
    }
  }
  spans.sort((left, right) => left.start - right.start)
  return spans
}

/** How far an `@` reaches before it stops being a mention and is just punctuation. */
const MAX_QUERY = 48

/**
 * The `@` being typed at the caret, and what follows it — or null. Only at
 * the start of a word (an email address is not a mention), never across a
 * line, and not inside a tag that is already there.
 */
export function mentionRange(value: string, caret: number, tokens: Iterable<string> = []): { start: number; query: string } | null {
  const before = value.slice(0, caret)
  const at = before.lastIndexOf("@")
  if (at === -1) return null
  const preceding = at === 0 ? "" : before[at - 1]!
  if (preceding && !/[\s(]/.test(preceding)) return null
  const query = before.slice(at + 1)
  if (query.includes("\n") || query.length > MAX_QUERY) return null
  const insideTag = mentionSpans(value, tokens).some((span) => at >= span.start && at < span.end)
  if (insideTag) return null
  return { start: at, query }
}

/** Whether a row answers the query: by its label or its detail, ignoring case. */
export function mentionMatches(item: Pick<MentionItem, "label" | "detail">, query: string): boolean {
  if (!query) return true
  const needle = query.toLowerCase()
  if (item.label.toLowerCase().includes(needle)) return true
  return (item.detail ?? "").toLowerCase().includes(needle)
}

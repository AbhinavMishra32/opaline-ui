import { questionExchange } from "./question-exchange"
import { inferTool } from "./tools"
import type { MessagePart, ReasoningPart } from "./types"

/**
 * A row of a turn: one part, and — for a tool call — the thinking that led to
 * it and the thinking it prompted, which ride in the panel the row opens.
 */
export type PartRow = {
  part: MessagePart
  /** Settled reasoning immediately before the call. */
  thinking?: ReasoningPart
  /** Settled reasoning after the turn's last call, before it answers. */
  after?: ReasoningPart
}

/** A tool that asks the person something, by its name. */
export function isAskTool(name: string): boolean {
  return inferTool(name).kind === "ask"
}

/**
 * Whether a part is one of the turn's outcomes rather than a step toward it —
 * an answered question. Outcomes are drawn as cards below the fold, and as
 * ordinary rows inside it.
 */
export function isOutcome(part: MessagePart): boolean {
  if (part.type === "question") return part.status === "answered"
  if (part.type === "tool" && part.status === "done" && isAskTool(part.name)) {
    return questionExchange(part.input, part.output).some((item) => item.answer.trim().length > 0)
  }
  return false
}

/* "Preparing read file" only says what the wait is for, and only while it is
   the wait: anything after it means the wait is over. */
function isPreparation(part: MessagePart, next: MessagePart | undefined): boolean {
  if (part.type !== "status" || next === undefined) return false
  const text = part.text.trim()
  if (next.type === "tool" && text === `Preparing ${next.name.replace(/[_-]/g, " ")}`) return true
  return /^Preparing [a-z0-9 ]+$/.test(text) || text === "Preparing the next action"
}

/**
 * Rows, in the order everything happened. Shared by the live turn and one
 * read back from storage, so the two fold identically.
 *
 * - Thinking interrupted only by more thinking is one thought: consecutive
 *   settled reasoning blocks are joined.
 * - A settled thought immediately followed by a call belongs to that call
 *   (`thinking`); the thought after the last call, before the answer, goes back
 *   onto it (`after`). A thought still streaming, or one that led to prose,
 *   keeps its own row.
 * - "Preparing <tool>" statuses go once the wait they describe is over.
 *
 * Pass `bind: false` to keep every reasoning block as its own row.
 */
export function groupParts(parts: readonly MessagePart[], { bind = true }: { bind?: boolean } = {}): PartRow[] {
  const grouped: PartRow[] = []
  for (const [index, part] of parts.entries()) {
    if (isPreparation(part, parts[index + 1])) continue
    const held = grouped.at(-1)?.part
    if (part.type === "reasoning" && !part.streaming && held?.type === "reasoning" && !held.streaming) {
      grouped[grouped.length - 1] = {
        part: {
          ...held,
          /* A blank line: a heading is only a heading at the start of a line. */
          text: `${held.text}\n\n${part.text}`.trim(),
          ...(held.endedAt !== undefined || part.endedAt !== undefined ? { endedAt: Math.max(held.endedAt ?? 0, part.endedAt ?? 0) } : {}),
        },
      }
      continue
    }
    grouped.push({ part })
  }
  return bind ? bindThinking(grouped) : grouped
}

function bindThinking(rows: PartRow[]): PartRow[] {
  const bound: PartRow[] = []
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!
    const next = rows[index + 1]
    const settled = row.part.type === "reasoning" && !row.part.streaming ? row.part : undefined
    if (settled && next?.part.type === "tool" && !next.thinking && !isOutcome(next.part)) {
      bound.push({ ...next, thinking: settled })
      index += 1
      continue
    }
    const held = bound.at(-1)
    if (settled && held?.part.type === "tool" && !held.after && !isOutcome(held.part) && (!next || next.part.type === "text")) {
      bound[bound.length - 1] = { ...held, after: settled }
      continue
    }
    bound.push(row)
  }
  return bound
}

import { questionExchange } from "./question-exchange"
import { inferTool } from "./tools"
import type { MessagePart } from "./types"

/** A row of a turn: one part. Thinking always has rows of its own, never inside a tool's. */
export type PartRow = {
  part: MessagePart
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
 *   settled reasoning blocks are joined. A thought is always its own row,
 *   before the call it led to, never folded into that call's panel.
 * - "Preparing <tool>" statuses go once the wait they describe is over.
 */
export function groupParts(parts: readonly MessagePart[]): PartRow[] {
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
  return grouped
}

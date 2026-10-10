import type { Question, QuestionAnswer, QuestionPart } from "./types"

/** One question and what was said to it, flattened for a read-only view. */
export type Exchange = { header?: string; question: string; answer: string; choices: string[] }

function json(value: unknown): unknown {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

/** The text of one answer: the picked labels, or what was typed. */
export function answerText(answer: QuestionAnswer | undefined): string {
  if (!answer) return ""
  const custom = answer.custom?.trim()
  return [...answer.selected, ...(custom ? [custom] : [])].join(", ")
}

/**
 * Answers as one string for the agent: the body alone for one question,
 * `header: body` lines for several. `parseQuestionCall` reads it back.
 */
export function formatQuestionAnswers(questions: readonly Question[], answers: readonly QuestionAnswer[]): string {
  return questions
    .map((item, index) => {
      const body = answerText(answers[index])
      return questions.length === 1 ? body : `${item.header}: ${body}`
    })
    .join("\n")
}

/** A question part, flattened. Cancelled parts have nothing to show. */
export function partExchange(part: QuestionPart): Exchange[] {
  if (part.status === "cancelled") return []
  return part.questions.map((item, index) => ({
    header: item.header,
    question: item.question,
    answer: answerText(part.answers?.[index]),
    choices: item.options.map((option) => option.label),
  }))
}

/** Read the questions out of an `ask_user`-style tool's input, if it has any. */
export function readQuestions(input: unknown): Question[] {
  const args = object(json(input))
  const raw = Array.isArray(args.questions) ? args.questions : typeof args.question === "string" ? [args] : []
  return raw.map(object).flatMap((item): Question[] => {
    if (typeof item.question !== "string" || !item.question.trim()) return []
    const options = (Array.isArray(item.options) ? item.options : Array.isArray(item.choices) ? item.choices : []).flatMap((option) => {
      if (typeof option === "string") return [{ label: option }]
      const entry = object(option)
      if (typeof entry.label !== "string") return []
      return [{ label: entry.label, ...(typeof entry.description === "string" ? { description: entry.description } : {}) }]
    })
    return [
      {
        header: typeof item.header === "string" ? item.header : "",
        question: item.question,
        options,
        ...(item.multiple === true || item.multiSelect === true ? { multiple: true } : {}),
        ...(item.custom === false ? { custom: false } : {}),
      },
    ]
  })
}

/**
 * Read an ask-the-user tool call — `{ questions: [...] }` in, an answer string
 * (or `{ answer }`) out — as exchanges. Also reads the older one-question
 * `{ question, choices }` shape. A cancelled result reads as none.
 */
export function questionExchange(input: unknown, output: unknown): Exchange[] {
  const result = json(output)
  const outcome = object(result)
  if (outcome.status === "cancelled") return []
  const answer = typeof result === "string" ? result : typeof outcome.answer === "string" ? outcome.answer : ""
  const questions = readQuestions(input)
  if (!questions.length) return []
  const answers = splitAnswers(
    questions.map((item) => item.header),
    answer,
  )
  if (answers.length !== questions.length) return [{ question: questions.map((item) => item.question).join("\n"), answer, choices: [] }]
  return questions.map((item, index) => ({
    header: item.header,
    question: item.question,
    answer: answers[index] ?? "",
    choices: item.options.map((option) => option.label),
  }))
}

function splitAnswers(headers: string[], answer: string): string[] {
  if (headers.length === 1) return [answer]
  const answers: string[] = []
  let cursor = 0
  for (const [index, header] of headers.entries()) {
    const prefix = `${header}: `
    if (!answer.startsWith(prefix, cursor)) return [answer]
    const start = cursor + prefix.length
    const next = headers[index + 1]
    const end = next === undefined ? answer.length : answer.indexOf(`\n${next}: `, start)
    if (end < 0) return [answer]
    answers.push(answer.slice(start, end).trim())
    cursor = end + 1
  }
  return answers
}

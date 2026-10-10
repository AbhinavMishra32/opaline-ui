import * as React from "react"
import { ArrowRight, ArrowUp, Check, Loader2, Pencil } from "lucide-react"
import { cn } from "../lib/utils"
import { useThreadConfig } from "./config"
import { Inline } from "./markdown"
import { partExchange } from "./question-exchange"
import { Exchanges } from "./tool-views"
import type { Question, QuestionAnswer, QuestionPart } from "./types"

/** Digits pick the first nine options; a tenth would need two keystrokes. */
const DIGITS = 9

type Draft = { type: "select"; labels: string[] } | { type: "custom"; value: string }

function toAnswer(draft: Draft | undefined): QuestionAnswer {
  if (!draft) return { selected: [] }
  return draft.type === "custom" ? { selected: [], custom: draft.value.trim() } : { selected: draft.labels }
}

function complete(draft: Draft | undefined): boolean {
  return draft?.type === "custom" ? draft.value.trim().length > 0 : Boolean(draft?.labels.length)
}

export type AskUserQuestionProps = {
  /** One to three questions, asked one at a time. */
  questions: Question[]
  /** Called once every question has an answer, lined up by index. */
  onSubmit: (answers: QuestionAnswer[]) => void
  /** Shows a Skip control. Called when the person declines to answer. */
  onCancel?: () => void
  /** The answer is on its way: controls lock and the button spins. */
  busy?: boolean
  /** Take focus on mount so the digit keys work at once. Default true. */
  autoFocus?: boolean
  className?: string
}

/**
 * The agent asking the person something before it goes on.
 *
 * Built as the composer — same glass shell, same footer outside it, hint left
 * and one round button right — because it stands in the composer's place:
 * the composer asking, not a panel that replaced it. Digits pick an option,
 * Return moves on; a typed answer is always one row away.
 */
export function AskUserQuestion({ questions, onSubmit, onCancel, busy = false, autoFocus = true, className }: AskUserQuestionProps) {
  const { labels } = useThreadConfig()
  const [step, setStep] = React.useState(0)
  const [drafts, setDrafts] = React.useState<Record<number, Draft>>({})
  const customField = React.useRef<HTMLTextAreaElement>(null)
  const card = React.useRef<HTMLDivElement>(null)
  const question = questions[step]
  const offersCustom = question ? question.custom !== false : false
  /* No offered choices means the answer is prose, not a one-item menu. */
  const sole = question ? question.options.length === 0 && offersCustom : false
  const draft: Draft = drafts[step] ?? (sole ? { type: "custom", value: "" } : { type: "select", labels: [] })
  const last = step === questions.length - 1
  const currentComplete = complete(draft)
  const allComplete = questions.every((_, index) => complete(index === step ? draft : drafts[index]))
  const identity = questions.map((item) => item.question).join("\u0000")

  React.useEffect(() => {
    setStep(0)
    setDrafts({})
    if (autoFocus) card.current?.focus({ preventScroll: false })
  }, [identity, autoFocus])

  React.useEffect(() => {
    if (draft.type === "custom" && (autoFocus || step > 0 || !sole)) customField.current?.focus()
  }, [draft.type, step, sole, autoFocus])

  if (!question) return null

  const setDraft = (next: Draft) => setDrafts((current) => ({ ...current, [step]: next }))

  const select = (label: string) => {
    const selected = draft.type === "select" ? draft.labels : []
    setDraft({
      type: "select",
      labels: question.multiple ? (selected.includes(label) ? selected.filter((item) => item !== label) : [...selected, label]) : [label],
    })
  }

  const proceed = () => {
    if (!currentComplete || busy) return
    if (!last) setStep((value) => value + 1)
    else if (allComplete) onSubmit(questions.map((_, index) => toAnswer(index === step ? draft : drafts[index])))
  }

  /* Digits pick and Return commits — scoped to the card, and ignored while the
     typed answer has the caret: "2 years" must not select the second option. */
  const shortcut = (event: React.KeyboardEvent) => {
    if (busy || event.metaKey || event.ctrlKey || event.altKey) return
    if (event.target instanceof HTMLTextAreaElement) return
    if (event.key === "Enter") {
      event.preventDefault()
      proceed()
      return
    }
    const digit = Number(event.key)
    if (!Number.isInteger(digit) || digit < 1) return
    const option = question.options[digit - 1]
    if (!option) return
    event.preventDefault()
    select(option.label)
  }

  const custom = draft.type === "custom"
  const canSend = currentComplete && !busy && (!last || allComplete)
  const many = questions.length > 1

  return (
    <div className={cn("op-thread-column outline-none", className)} data-slot="ask-user-question" onKeyDown={shortcut} ref={card} tabIndex={-1}>
      <div className="op-composer overflow-hidden p-2">
        <span className="mt-1 ml-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-thread-tool text-muted-foreground">
          <span className="min-w-0 truncate">{question.header}</span>
          {many && <span aria-hidden className="size-0.5 shrink-0 rounded-full bg-muted-foreground/60" />}
          {many && (
            <span className="shrink-0 tabular-nums">
              {step + 1}/{questions.length}
            </span>
          )}
        </span>
        <h3 className="px-1.5 py-1 text-thread leading-[1.55] font-medium text-foreground">
          <Inline text={question.question} />
        </h3>

        <div aria-label={question.question} className="mt-1 flex flex-col" role={question.multiple ? "group" : "radiogroup"}>
          {question.options.map((option, index) => {
            const selected = draft.type === "select" && draft.labels.includes(option.label)
            return (
              <button
                aria-checked={selected}
                className={cn(
                  "group/option flex w-full items-start gap-2.5 rounded-[var(--radius-item)] px-1.5 py-1 text-left outline-none transition-colors duration-150",
                  "focus-visible:bg-accent/40",
                  selected ? "bg-accent/70" : "hover:bg-accent/40",
                  busy && "pointer-events-none opacity-60",
                )}
                disabled={busy}
                key={option.label}
                onClick={() => select(option.label)}
                role={question.multiple ? "checkbox" : "radio"}
                type="button"
              >
                <Keycap multiple={Boolean(question.multiple)} selected={selected}>
                  {index < DIGITS ? index + 1 : null}
                </Keycap>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-thread leading-[1.55] transition-colors",
                      selected ? "text-foreground" : "text-foreground/80 group-hover/option:text-foreground",
                    )}
                  >
                    <Inline text={option.label} />
                  </span>
                  {option.description && (
                    <span className="block text-thread-tool leading-[1.45] text-muted-foreground">
                      <Inline text={option.description} />
                    </span>
                  )}
                </span>
              </button>
            )
          })}

          {offersCustom &&
            (custom ? (
              <div className={cn("flex items-start gap-2.5 rounded-[var(--radius-item)] px-1.5 py-1", !sole && "bg-accent/40")}>
                {!sole && (
                  <span aria-hidden className="grid h-[1.55em] w-5 shrink-0 place-items-center text-thread text-foreground/70">
                    <Pencil className="size-3.5" />
                  </span>
                )}
                <textarea
                  aria-label={labels.ownAnswer}
                  className={cn(
                    "op-scroll block max-h-40 w-full resize-none bg-transparent text-thread leading-[1.55] outline-none [field-sizing:content] placeholder:text-muted-foreground/65",
                    sole && "min-h-[4rem]",
                  )}
                  disabled={busy}
                  onChange={(event) => setDraft({ type: "custom", value: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault()
                      proceed()
                    }
                    if (event.key === "Escape" && !sole && !draft.value) {
                      event.preventDefault()
                      setDraft({ type: "select", labels: [] })
                      card.current?.focus()
                    }
                  }}
                  placeholder={sole ? labels.answerPlaceholderSole : labels.answerPlaceholder}
                  ref={customField}
                  rows={1}
                  value={draft.value}
                />
              </div>
            ) : (
              <button
                className="group/own flex w-full items-center gap-2.5 rounded-[var(--radius-item)] px-1.5 py-1 text-left text-thread leading-[1.55] text-muted-foreground/65 outline-none transition-colors duration-150 hover:bg-accent/40 hover:text-muted-foreground focus-visible:bg-accent/40 disabled:pointer-events-none disabled:opacity-60"
                disabled={busy}
                onClick={() => setDraft({ type: "custom", value: "" })}
                type="button"
              >
                <span aria-hidden className="grid size-5 shrink-0 place-items-center">
                  <Pencil className="size-3.5" />
                </span>
                {labels.customAnswer}
              </button>
            ))}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1 px-0.5">
        <p className="min-w-0 flex-1 truncate px-1 text-thread text-muted-foreground/65">
          {busy
            ? labels.questionSending
            : custom
              ? labels.questionHintTyping
              : question.multiple
                ? labels.questionHintMultiple
                : currentComplete
                  ? labels.questionHintReady
                  : labels.questionHintPick}
        </p>
        {onCancel && step === 0 && (
          <button
            className="shrink-0 rounded-full px-2 py-1 text-thread text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            {labels.dismissQuestion}
          </button>
        )}
        {step > 0 && (
          <button
            className="shrink-0 rounded-full px-2 py-1 text-thread text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
            disabled={busy}
            onClick={() => setStep((value) => value - 1)}
            type="button"
          >
            {labels.back}
          </button>
        )}
        <button
          aria-label={last ? labels.sendAnswer : labels.nextQuestion}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full transition-[background-color,color,transform,opacity] duration-150",
            canSend ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-95" : "bg-elevated text-muted-foreground/50",
          )}
          disabled={!canSend}
          onClick={proceed}
          title={last ? labels.sendAnswer : labels.nextQuestion}
          type="button"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : last ? <ArrowUp className="size-3.5" /> : <ArrowRight className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}

/**
 * The option's key. Its digit is the accelerator; filled, it is the selection.
 * A many-of question shows a check once ticked. Past the ninth option there is
 * no key, and the empty slot keeps the labels aligned.
 */
function Keycap({ multiple, selected, children }: { multiple: boolean; selected: boolean; children: React.ReactNode }) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "mt-[0.0625rem] grid size-5 shrink-0 place-items-center rounded-[0.3125rem] font-sans text-[0.6875rem] font-medium tabular-nums transition-[background-color,color,box-shadow] duration-150",
        selected
          ? "bg-foreground text-background"
          : children == null
            ? ""
            : "bg-foreground/[0.06] text-muted-foreground group-hover/option:text-foreground",
      )}
    >
      {selected && multiple ? <Check className="size-3" strokeWidth={3} /> : children}
    </kbd>
  )
}

/**
 * A question part in the transcript. Answered or cancelled, it is the
 * read-only exchange; pending, it is the interactive card when `interactive`,
 * and otherwise the question with "Waiting for your answer".
 */
export function QuestionCard({
  part,
  interactive = false,
  busy = false,
  onAnswer,
  onCancel,
}: {
  part: QuestionPart
  interactive?: boolean
  busy?: boolean
  onAnswer?: (partId: string, answers: QuestionAnswer[]) => void
  onCancel?: (partId: string) => void
}) {
  const { labels } = useThreadConfig()
  if (part.status === "pending" && interactive && onAnswer) {
    return (
      <AskUserQuestion
        autoFocus={false}
        busy={busy}
        onSubmit={(answers) => onAnswer(part.id, answers)}
        questions={part.questions}
        {...(onCancel ? { onCancel: () => onCancel(part.id) } : {})}
      />
    )
  }
  if (part.status === "cancelled") {
    return (
      <div className="min-w-0">
        {part.questions.map((item, index) => (
          <p className="text-thread leading-[1.55] font-medium text-foreground/70" key={index}>
            <Inline text={item.question} />
          </p>
        ))}
        <p className="mt-1 text-thread text-muted-foreground/70">{labels.questionCancelled}</p>
      </div>
    )
  }
  const exchanges =
    part.status === "pending"
      ? part.questions.map((item) => ({ header: item.header, question: item.question, answer: "", choices: item.options.map((option) => option.label) }))
      : partExchange(part)
  return <Exchanges exchanges={exchanges} />
}

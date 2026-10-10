import * as React from "react"

import { useControlledState } from "../hooks/use-controlled-state"
import { cn } from "../lib/utils"
import { Kbd } from "./kbd"

export type ChoiceTone = "danger" | "warning" | "success" | "info" | "neutral"

export type ChoiceOption<T extends string = string> = {
  value: T
  label: React.ReactNode
  /** A quiet second line: an interval, a count. */
  sublabel?: React.ReactNode
  /** The ink the choice takes, and the tint it fills with once chosen. Default `neutral`. */
  tone?: ChoiceTone
  /** A single key that picks this option, drawn as a key cap: `"1"`, `"a"`, `" "`. */
  shortcut?: string
  disabled?: boolean
}

export type ChoiceGroupProps<T extends string = string> = {
  options: ReadonlyArray<ChoiceOption<NoInfer<T>>>
  value?: T | null
  defaultValue?: T | null
  /** Called when an option is picked — by click, by Enter/Space, or by its shortcut. */
  onValueChange?: (value: T) => void
  /** The option the system would pick: marked, never selected for the person. */
  suggested?: NoInfer<T>
  /** The word on the suggested marker. Default "Suggested". */
  suggestedLabel?: string
  disabled?: boolean
  /**
   * Where shortcuts listen. `global` (default) hears them anywhere on the page
   * except in a text field; `group` only while focus is inside the group;
   * `none` turns them off and hides the key caps.
   */
  shortcutScope?: "global" | "group" | "none"
  /** `row` (default) is equal columns on one line; `stack` is one option per line. */
  layout?: "row" | "stack"
  "aria-label"?: string
  "aria-labelledby"?: string
  className?: string
}

const TONE: Record<ChoiceTone, string> = {
  danger: "var(--tone-danger)",
  warning: "var(--tone-warning)",
  success: "var(--tone-success)",
  info: "var(--tone-info)",
  neutral: "var(--foreground)",
}

function editable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === "TEXTAREA" || tag === "SELECT") return true
  if (tag !== "INPUT") return false
  const type = (target as HTMLInputElement).type
  return !["button", "checkbox", "radio", "range", "submit", "reset", "color", "file"].includes(type)
}

/**
 * A row of choices that each carry a meaning — Again, Hard, Good, Easy — with a
 * tone, an optional second line, and a key that picks it.
 *
 * A radio group underneath: arrow keys move between options and Enter or
 * Space picks, so moving never commits a choice by accident. Each option's
 * shortcut picks it outright, and the cap under the finger flashes so a
 * keyboard pick is seen as clearly as a click.
 */
export function ChoiceGroup<T extends string>({
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  suggested,
  suggestedLabel = "Suggested",
  disabled = false,
  shortcutScope = "global",
  layout = "row",
  className,
  ...aria
}: ChoiceGroupProps<T>) {
  const [value, setValue] = useControlledState<T | null>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next)
    },
  })
  const group = React.useRef<HTMLDivElement>(null)
  const buttons = React.useRef<Array<HTMLButtonElement | null>>([])
  const [pressed, setPressed] = React.useState<T | null>(null)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const firstEnabled = options.findIndex((option) => !option.disabled)
  const [focusIndex, setFocusIndex] = React.useState(selectedIndex >= 0 ? selectedIndex : Math.max(0, firstEnabled))
  React.useEffect(() => {
    if (selectedIndex >= 0) setFocusIndex(selectedIndex)
  }, [selectedIndex])

  const pick = React.useCallback(
    (option: ChoiceOption<T>) => {
      if (disabled || option.disabled) return
      setValue(option.value)
    },
    [disabled, setValue],
  )

  /* Latest options and pick for the window listener, so it binds once. */
  const latest = React.useRef({ options, pick, disabled })
  latest.current = { options, pick, disabled }

  React.useEffect(() => {
    if (shortcutScope === "none") return
    const onKey = (event: KeyboardEvent) => {
      const { options: current, pick: choose, disabled: off } = latest.current
      if (off || event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      if (editable(event.target)) return
      if (shortcutScope === "group" && !group.current?.contains(document.activeElement)) return
      const key = event.key.toLowerCase()
      const option = current.find((item) => item.shortcut !== undefined && item.shortcut.toLowerCase() === key)
      if (!option || option.disabled) return
      event.preventDefault()
      choose(option)
      setPressed(option.value)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcutScope])

  React.useEffect(() => {
    if (pressed === null) return
    const timer = window.setTimeout(() => setPressed(null), 160)
    return () => window.clearTimeout(timer)
  }, [pressed])

  const move = (from: number, step: number) => {
    for (let offset = 1; offset <= options.length; offset++) {
      const index = (from + step * offset + options.length * offset) % options.length
      if (!options[index]?.disabled) {
        setFocusIndex(index)
        buttons.current[index]?.focus()
        return
      }
    }
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown"
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp"
    if (forward || back) {
      event.preventDefault()
      move(index, forward ? 1 : -1)
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      move(event.key === "Home" ? -1 : options.length, event.key === "Home" ? 1 : -1)
    }
  }

  return (
    <div
      aria-disabled={disabled || undefined}
      className={cn(
        "grid gap-1.5",
        layout === "stack" && "grid-cols-1",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      data-slot="choice-group"
      ref={group}
      role="radiogroup"
      style={layout === "row" ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
      {...aria}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        const isSuggested = option.value === suggested
        const tone = TONE[option.tone ?? "neutral"]
        return (
          <button
            aria-checked={selected}
            aria-keyshortcuts={option.shortcut && shortcutScope !== "none" ? option.shortcut : undefined}
            className={cn(
              "group/choice relative flex min-w-0 cursor-default flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2.5 text-center outline-none select-none",
              "transition-[background-color,box-shadow,transform] duration-150 ease-out motion-reduce:transition-none",
              "bg-[color-mix(in_oklab,var(--choice)_4%,var(--elevated))] ring-[0.5px] ring-[var(--border-surface-strong)]",
              "hover:bg-[color-mix(in_oklab,var(--choice)_10%,var(--elevated))] active:scale-[0.98] data-[pressed]:scale-[0.97]",
              "focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--choice)_55%,transparent)]",
              selected && "bg-[color-mix(in_oklab,var(--choice)_16%,transparent)] ring-1 ring-[color-mix(in_oklab,var(--choice)_55%,transparent)] hover:bg-[color-mix(in_oklab,var(--choice)_20%,transparent)]",
              option.disabled && "cursor-not-allowed opacity-40",
              layout === "stack" && "flex-row justify-start gap-2 text-left",
            )}
            data-pressed={pressed === option.value || undefined}
            data-selected={selected || undefined}
            data-suggested={isSuggested || undefined}
            data-tone={option.tone ?? "neutral"}
            disabled={disabled || option.disabled}
            key={option.value}
            onClick={() => {
              setFocusIndex(index)
              pick(option)
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
            ref={(node) => {
              buttons.current[index] = node
            }}
            role="radio"
            style={{ "--choice": tone } as React.CSSProperties}
            tabIndex={index === focusIndex ? 0 : -1}
            type="button"
          >
            {isSuggested && !selected && (
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] border border-dashed border-[color-mix(in_oklab,var(--choice)_50%,transparent)]" />
            )}
            {isSuggested && (
              <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-background px-1.5 text-[0.625rem] leading-4 font-medium tracking-wide whitespace-nowrap text-[var(--choice)] uppercase ring-[0.5px] ring-[color-mix(in_oklab,var(--choice)_45%,transparent)]">
                {suggestedLabel}
              </span>
            )}
            <span className={cn("flex min-w-0 items-center gap-1.5", layout === "stack" && "flex-1")}>
              <span className={cn("min-w-0 truncate text-sm font-medium", option.tone && option.tone !== "neutral" ? "text-[var(--choice)]" : "text-foreground")}>
                {option.label}
              </span>
            </span>
            {option.sublabel != null && <span className="min-w-0 truncate text-xs text-muted-foreground tabular-nums">{option.sublabel}</span>}
            {option.shortcut && shortcutScope !== "none" && (
              <Kbd
                aria-hidden
                className={cn(
                  "mt-1 h-4.5 min-w-4.5 text-[0.6875rem] transition-colors",
                  (selected || pressed === option.value) && "bg-[color-mix(in_oklab,var(--choice)_22%,transparent)] text-foreground",
                  layout === "stack" && "mt-0",
                )}
              >
                {option.shortcut === " " ? "Space" : option.shortcut.toUpperCase()}
              </Kbd>
            )}
          </button>
        )
      })}
    </div>
  )
}

export type Rating = "again" | "hard" | "good" | "easy"

export type RatingPickerProps = Omit<ChoiceGroupProps<Rating>, "options"> & {
  /** The next interval for each answer, shown under its name: `{ again: "<1m", good: "3d" }`. */
  intervals?: Partial<Record<Rating, React.ReactNode>>
  /** Rename the four answers. */
  labels?: Partial<Record<Rating, React.ReactNode>>
  /** Keys for the four answers, in order. Default `["1", "2", "3", "4"]`. */
  shortcuts?: [string, string, string, string] | null
  /** Leave answers out — a two-button `again`/`good` review, say. */
  include?: Rating[]
}

const RATINGS: Array<{ value: Rating; label: string; tone: ChoiceTone }> = [
  { value: "again", label: "Again", tone: "danger" },
  { value: "hard", label: "Hard", tone: "warning" },
  { value: "good", label: "Good", tone: "success" },
  { value: "easy", label: "Easy", tone: "info" },
]

/**
 * The spaced-repetition answer: Again, Hard, Good, Easy, on keys 1–4, each with
 * the interval it would schedule.
 *
 *   <RatingPicker intervals={{ again: "<1m", hard: "6m", good: "1d", easy: "4d" }} onValueChange={grade} />
 */
export function RatingPicker({ intervals, labels, shortcuts = ["1", "2", "3", "4"], include, "aria-label": label = "Rate your recall", ...props }: RatingPickerProps) {
  const options = RATINGS.filter((rating) => !include || include.includes(rating.value)).map(
    (rating): ChoiceOption<Rating> => ({
      value: rating.value,
      label: labels?.[rating.value] ?? rating.label,
      tone: rating.tone,
      ...(intervals?.[rating.value] != null ? { sublabel: intervals[rating.value] } : {}),
      ...(shortcuts ? { shortcut: shortcuts[RATINGS.indexOf(rating)]! } : {}),
    }),
  )
  return <ChoiceGroup aria-label={label} options={options} {...props} />
}

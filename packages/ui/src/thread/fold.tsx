import * as React from "react"
import { ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useThreadConfig } from "./config"

/** How long a turn took, the way a person says it: never milliseconds, never a decimal. */
export function formatDuration(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * What a short turn took, in things rather than seconds. "Worked for 5s" is a
 * figure nobody has a use for — the reader watched the whole time. Chosen from
 * the turn's own timings rather than at random, so a turn says the same thing
 * every time it is drawn.
 */
const A_MOMENT = [
  "about one variable name",
  "less than a git status",
  "one sip of coffee",
  "about two blinks",
  "less than a tab switch",
  "one stretch of the fingers",
  "shorter than a rename",
  "half a stack trace",
  "one glance at the docs",
  "less than a compile",
  "about one deep breath",
  "a keystroke or two",
] as const

export function aMoment(seed: number): string {
  const whole = Math.abs(Math.trunc(seed))
  const mixed = (whole ^ (whole >>> 3) ^ (whole >>> 7)) >>> 0
  return A_MOMENT[mixed % A_MOMENT.length]!
}

/** Under this a settled turn shows no fold: a header saying a turn took no time is a line about nothing. */
const WORTH_FOLDING_MS = 1000
/** Above this the number is information. Below it, a stopwatch on a conversation. */
const A_MOMENT_MS = 30_000

export type WorkFoldProps = {
  /** Whether the turn is still running. */
  live: boolean
  /** When it began. Absent for a stored turn, which carries `durationMs`. */
  startedAt?: number
  /** When the reply began — the end of the work. This is what closes the fold. */
  replyStartedAt?: number
  durationMs?: number
  /** Whether there is any work to show yet. Before there is, the header stays away. */
  connected?: boolean
  /** Fix the fold's state instead of letting it follow the turn. */
  mode?: "auto" | "open" | "closed"
  /**
   * Fetch the body the first time the fold is opened — for older turns whose
   * steps are kept on disk rather than in memory. A rejected promise offers a
   * retry.
   */
  onOpen?: () => void | Promise<void>
  /** Whether the body is here yet. False until `onOpen` has resolved. Default true. */
  bodyLoaded?: boolean
  children: React.ReactNode
}

/**
 * The turn's work, folded into one line.
 *
 * Every step of a turn is the right thing to watch while it runs and the wrong
 * thing to scroll past afterwards. So the work opens while it happens and folds
 * itself away the moment the agent starts answering. A click overrides it and
 * the choice sticks: someone who opened a turn to read its steps does not want
 * it closing under them when the next phase starts.
 */
export function WorkFold({
  live,
  startedAt,
  replyStartedAt,
  durationMs,
  connected = true,
  mode = "auto",
  onOpen,
  bodyLoaded = true,
  children,
}: WorkFoldProps) {
  const { labels, reduced, duration } = useThreadConfig()
  const [override, setOverride] = React.useState<boolean | undefined>(mode === "auto" ? undefined : mode === "open")
  const [now, setNow] = React.useState(() => Date.now())
  const [loading, setLoading] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const working = live && replyStartedAt === undefined

  const load = async () => {
    if (!onOpen || bodyLoaded || loading) return
    setLoading(true)
    setFailed(false)
    try {
      await onOpen()
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!working) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [working])

  const elapsed =
    startedAt === undefined
      ? durationMs
      : Math.max(0, (replyStartedAt ?? (live ? now : startedAt + (durationMs ?? 0))) - startedAt)
  const open = connected ? (override ?? working) : true
  /* Closed by the reply arriving rather than by a click — the only close that
     compacts, the lid shutting on the work while the answer unfolds below. */
  const sawWorking = React.useRef(false)
  if (working) sawWorking.current = true
  const compacting = !open && override === undefined && sawWorking.current

  const known = elapsed !== undefined && elapsed > 0
  const worthFolding = live || !known || elapsed >= WORTH_FOLDING_MS
  const length = !known
    ? "a moment"
    : typeof duration === "function"
      ? duration(elapsed)
      : duration === "precise" || elapsed >= A_MOMENT_MS
        ? formatDuration(elapsed)
        : aMoment((startedAt ?? 0) + elapsed)

  if (!worthFolding) return <div className="min-w-0">{children}</div>

  return (
    <div className="min-w-0">
      {connected && (
        <button
          aria-expanded={open}
          className="group/fold -mx-1 flex min-h-6 w-[calc(100%+0.5rem)] cursor-default items-center gap-1 border-b border-border/40 px-1 pb-2 text-thread text-muted-foreground transition-colors select-none hover:text-foreground"
          onClick={() => {
            if (!open) void load()
            setOverride(!open)
          }}
          title={known && !working ? labels.foldTitle(formatDuration(elapsed), open) : undefined}
          type="button"
        >
          {/* The turn landing, said once: the past tense rises into the present
              tense's place. Keyed on the tense, not the text, so the clock's
              own ticks pass through without animating. */}
          <span className="relative min-w-0 truncate">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate={{ y: 0, opacity: 1 }}
                className="block min-w-0 truncate"
                exit={reduced ? { opacity: 0 } : { y: -10, opacity: 0 }}
                initial={reduced ? false : { y: 10, opacity: 0 }}
                key={working ? "working" : "worked"}
                transition={reduced ? { duration: 0 } : { type: "spring", visualDuration: 0.4, bounce: 0.18 }}
              >
                {working ? labels.working(known ? formatDuration(elapsed) : "") : labels.worked(length)}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            aria-hidden
            className="inline-flex shrink-0"
            transition={{ type: "spring", visualDuration: reduced ? 0 : 0.34, bounce: 0.2 }}
          >
            <ChevronRight className="size-3.5" />
          </motion.span>
        </button>
      )}
      {/* The clip is taken a few pixels off the steps so a card's shadow
          inside survives; the negative margin gives the space back. */}
      <motion.div
        animate={{ height: open ? "auto" : 0, opacity: open || compacting ? 1 : 0 }}
        className={`-mx-2 -mb-1.5 overflow-hidden px-2 pb-1.5${compacting ? " flex flex-col justify-end" : ""}`}
        initial={false}
        transition={
          reduced
            ? { duration: 0 }
            : {
                height: open
                  ? { type: "spring", visualDuration: 0.46, bounce: 0.05 }
                  : compacting
                    ? { type: "spring", visualDuration: 0.9, bounce: 0 }
                    : { type: "tween", duration: 0.55, ease: [0.32, 0.72, 0, 1] },
                opacity: open ? { duration: 0.3, delay: 0.04 } : compacting ? { duration: 0 } : { duration: 0.2, delay: 0.3, ease: "easeIn" },
              }
        }
      >
        <motion.div
          animate={{ scale: compacting ? 0.97 : 1 }}
          className={`min-w-0 shrink-0${connected ? " pt-2" : ""}`}
          inert={!open}
          initial={false}
          style={{ transformOrigin: "50% 100%" }}
          transition={reduced || !compacting ? { duration: 0 } : { type: "spring", visualDuration: 0.9, bounce: 0 }}
        >
          {!bodyLoaded && loading && (
            <p className="py-1 text-thread text-muted-foreground" role="status">
              {labels.loadingSteps}
            </p>
          )}
          {!bodyLoaded && failed && (
            <button className="py-1 text-thread text-muted-foreground transition-colors hover:text-foreground" onClick={() => void load()} type="button">
              {labels.stepsFailed}
            </button>
          )}
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}

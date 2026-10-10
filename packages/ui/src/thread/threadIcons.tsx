/**
 * The transcript's marks.
 *
 * Every row of a turn hangs one of these in its gutter. They are outline
 * glyphs (lucide) drawn at a 1.75 stroke — firm enough at 16px to hold their
 * shape beside 14px text, and the same family as every other icon in the
 * kit, so the thread does not read as a separate drawing. The row owns the
 * colour (`currentColor`), so a mark dims and brightens with its label.
 *
 * The export names are the thread's vocabulary, not lucide's: a row asks for
 * "the edit mark", and which glyph that is gets decided here, once. Hosts reach
 * them as `icons.IconEdit` from `@opaline/ui/thread`.
 *
 * `LiveMark` is the other half: while a step runs it wears its own glyph,
 * breathing, so landing is the mark going still rather than turning into a
 * different picture.
 */
import type * as React from "react"
import {
  Book,
  BookMarked,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  CirclePlay,
  CircleX,
  Code,
  CornerDownRight,
  Cpu,
  FileSearch,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  History,
  Info,
  Lightbulb,
  List,
  LoaderCircle,
  PencilLine,
  Puzzle,
  Search,
  Sparkle,
  Terminal,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react"

/** The stroke every mark is drawn at. Lucide's default 2 reads heavy at 16px. */
const MARK_STROKE = 1.75

/**
 * A lucide glyph as a thread mark: the thread's stroke weight, and hidden from
 * assistive tech (the row's words already say what the mark shows).
 */
function mark(Glyph: LucideIcon) {
  function Mark(props: LucideProps) {
    return <Glyph aria-hidden strokeWidth={MARK_STROKE} {...props} />
  }
  Mark.displayName = Glyph.displayName ?? "Mark"
  return Mark
}

export const IconSearch = mark(Search)
export const IconGlobe = mark(Globe)
export const IconFile = mark(FileText)
/** Looking through a file for something — an inspection rather than a read. */
export const IconFileSearch = mark(FileSearch)
export const IconCode = mark(Code)
export const IconEdit = mark(PencilLine)
export const IconFolder = mark(FolderOpen)
/** A folder with nothing to say about being open: a row naming a directory. */
export const IconFolderPlain = mark(Folder)
export const IconTerminal = mark(Terminal)
export const IconChip = mark(Cpu)
export const IconDossier = mark(BriefcaseBusiness)
export const IconBook = mark(Book)
export const IconList = mark(List)
export const IconCheck = mark(Check)
export const IconQuestion = mark(CircleHelp)
export const IconAlert = mark(CircleAlert)
export const IconInfo = mark(Info)
export const IconCircleX = mark(CircleX)
/** The elbow that marks a line as belonging to the row above it. */
export const IconCornerArrow = mark(CornerDownRight)
export const IconLightning = mark(Zap)
export const IconHistory = mark(History)
export const IconSparkle = mark(Sparkle)
export const IconPuzzle = mark(Puzzle)
export const IconPlay = mark(CirclePlay)
export const IconChevronRight = mark(ChevronRight)
/** Skill: instructions the agent reached for, not a file of the user's. */
export const IconSkill = mark(BookMarked)
/** The model reasoning. */
export const IconThinking = mark(Lightbulb)
/** Waiting on the model itself, before any step has a glyph of its own. */
export const IconWaiting = mark(LoaderCircle)

/**
 * A step with nothing more specific to say.
 *
 * Not a wrench, and not a tick. A tool the transcript has no mark for is not a
 * tool that failed and not one that did anything the reader can name from a
 * glyph, so it gets the smallest possible statement that something happened —
 * which also keeps a run of unfamiliar tools from reading as a column of
 * identical hardware.
 */
export function IconDot({ className }: { className?: string }) {
  return <span className={className ?? "size-1.5 rounded-full bg-[currentColor] opacity-35"} />
}

/**
 * A mark while its step is still under way: the step's own glyph, breathing.
 *
 * An orb said "something is running" in a different visual language from
 * every settled row. The glyph itself says what is running, and the slow pulse
 * says that it is — so when the step lands the mark simply stops moving.
 */
export function LiveMark({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span aria-label={label} className="inline-flex animate-pulse motion-reduce:animate-none" role="img">
      {children}
    </span>
  )
}

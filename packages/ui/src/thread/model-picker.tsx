import * as React from "react"
import { ArrowUpRight, ChevronDown, Search } from "lucide-react"
import { cn } from "../lib/utils"
import {
  DropdownMenu,
  DropdownMenuCheckItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../components/dropdown-menu"
import { Separator } from "../components/separator"
import { Switch } from "../components/switch"
import { Tooltip, TooltipContent, TooltipKeys, TooltipTrigger } from "../components/tooltip"
import { ProviderIcon } from "./provider-icons"

export type ModelOption = {
  id: string
  name: string
  /** A second line under the name in the flat list. */
  description?: string
  /** Whether the model can think. `EffortPicker` is only worth showing when it can. */
  reasoning?: boolean
}

export type ModelProvider = {
  id: string
  name: string
  /** The provider's mark. Defaults to `<ProviderIcon provider={id} />`, which knows the common vendors. */
  icon?: React.ComponentType<{ className?: string }>
  models: ModelOption[]
}

export type ModelValue = { provider: string; model: string }

/* ---- Shortcuts ------------------------------------------------------------------ */

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

/** How a ⇧⌘ chord is written on this platform. */
function chord(key: string) {
  const shown = key === "." ? "." : key.toUpperCase()
  return isMac ? `⇧⌘${shown}` : `Shift+Ctrl+${shown}`
}

/* Several composers can be mounted at once (a chat kept alive behind another
   view), so a shortcut cannot be a listener per picker or it opens every one of
   them. Pickers register here, one listener serves them all, and the key goes
   to the last picker actually on screen: the one being typed into. */
type Opener = { readonly el: HTMLElement | null; readonly key: string; open(): void }

const openers = new Set<Opener>()
let listening: ((event: KeyboardEvent) => void) | null = null

function onShortcut(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) return
  /* Under Shift, `event.key` is the shifted character (">" for the period on a
     US layout), so the physical key is what has to match. */
  const code = event.code === "Period" ? "." : event.key.toLowerCase()
  /* `offsetParent` is null for anything display:none or inside a hidden pane,
     which is exactly the composer that should not answer for the key. */
  const target = [...openers].filter((opener) => opener.key === code && opener.el?.offsetParent).at(-1)
  if (!target) return
  event.preventDefault()
  target.open()
}

function useComposerShortcut(key: string | false, open: () => void) {
  const trigger = React.useRef<HTMLButtonElement>(null)
  const latest = React.useRef(open)
  latest.current = open

  React.useEffect(() => {
    if (!key) return
    const opener: Opener = {
      get el() {
        return trigger.current
      },
      key,
      open: () => latest.current(),
    }
    openers.add(opener)
    if (!listening) {
      listening = onShortcut
      addEventListener("keydown", listening)
    }
    return () => {
      openers.delete(opener)
      if (openers.size === 0 && listening) {
        removeEventListener("keydown", listening)
        listening = null
      }
    }
  }, [key])

  return trigger
}

/* At rest the pair reads as a line of text: no fill, no padding. The pill is
   what the pointer brings. Held padding would still stand between the model and
   the effort as empty space, splitting what reads as one statement. */
const quietTrigger =
  "inline-flex h-7 shrink-0 items-center rounded-full text-ui-sm font-medium outline-none transition-[padding,background-color,color] duration-150 hover:bg-muted aria-expanded:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"

function Mark({ provider, className }: { provider: ModelProvider; className?: string }) {
  const Icon = provider.icon
  return Icon ? <Icon className={className} /> : <ProviderIcon className={className} provider={provider.id} />
}

/* ---- Model ------------------------------------------------------------------------ */

export type ModelPickerProps = {
  providers: ModelProvider[]
  value: ModelValue
  onValueChange: (value: ModelValue) => void
  /** Adds a Settings row at the foot of the menu. */
  onOpenSettings?: () => void
  /** The key for ⇧⌘ + key, or `false` for none. Default `"m"`. */
  shortcut?: string | false
  /** Default "Search models". */
  searchPlaceholder?: string
  /** Default "Model". */
  label?: string
  align?: "start" | "center" | "end"
  className?: string
}

/**
 * The composer's model control.
 *
 * At rest it is the provider's mark and the model's name at full strength,
 * because the model in force is worth reading; the pill and the chevron arrive
 * with the pointer. Several providers become submenus, and typing collapses the
 * whole menu into one flat search, which is faster than either.
 */
export function ModelPicker({
  providers,
  value,
  onValueChange,
  onOpenSettings,
  shortcut = "m",
  searchPlaceholder = "Search models",
  label = "Model",
  align = "start",
  className,
}: ModelPickerProps) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const trigger = useComposerShortcut(shortcut, () => setOpen(true))
  const field = React.useRef<HTMLInputElement>(null)

  const available = providers.filter((provider) => provider.models.length > 0)
  const active = available.find((provider) => provider.id === value.provider)
  const activeModel = active?.models.find((model) => model.id === value.model)

  const matches = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return available
      .flatMap((provider) => provider.models.map((model) => ({ provider, model })))
      .filter(({ provider, model }) => `${provider.name} ${model.name}`.toLowerCase().includes(needle))
      .slice(0, 40)
  }, [available, query])

  const isChecked = (provider: ModelProvider, model: ModelOption) => provider.id === value.provider && model.id === value.model
  const choose = (provider: ModelProvider, model: ModelOption) => onValueChange({ provider: provider.id, model: model.id })

  return (
    <DropdownMenu
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
      open={open}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label={label}
            className={cn(
              quietTrigger,
              "group max-w-[10rem] gap-1.5 px-0 text-foreground/90 hover:pr-2 hover:pl-1.5 hover:text-foreground aria-expanded:pr-2 aria-expanded:pl-1.5 aria-expanded:text-foreground",
              className,
            )}
            ref={trigger}
          >
            {active && <Mark className="size-4 shrink-0" provider={active} />}
            <span className="truncate">{activeModel?.name ?? value.model}</span>
            {/* Collapsed rather than hidden, so the name does not shift the moment the pointer lands. */}
            <ChevronDown className="size-3.5 w-0 shrink-0 opacity-0 transition-[width,opacity] duration-150 group-hover:w-3.5 group-hover:opacity-50 group-aria-expanded:w-3.5 group-aria-expanded:opacity-50" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {label}
          {shortcut && <TooltipKeys>{chord(shortcut)}</TooltipKeys>}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align={align}
        className="min-w-[13rem]"
        /* While a query is typed the keyboard owns the list. Radix focuses
           whatever row the pointer crosses, which takes the caret out of the
           field mid-word; defaulting the event first makes Radix skip it. */
        onPointerMoveCapture={(event) => {
          if (!query.trim()) return
          event.preventDefault()
          requestAnimationFrame(() => field.current?.focus({ preventScroll: true }))
        }}
        side="top"
      >
        {/* The menu's first row, not a header. Radix runs a typeahead on
            printable keys, so the field swallows them to stay typable. */}
        <div className="flex min-h-7 items-center gap-2 px-2" onKeyDown={(event) => event.stopPropagation()}>
          <Search className="size-4 shrink-0 text-muted-foreground/70" />
          <input
            className="w-full bg-transparent text-ui leading-none outline-none placeholder:text-muted-foreground/60"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            ref={field}
            value={query}
          />
        </div>

        {query.trim() ? (
          matches.length > 0 ? (
            matches.map(({ provider, model }) => (
              <DropdownMenuCheckItem checked={isChecked(provider, model)} key={`${provider.id}:${model.id}`} onSelect={() => choose(provider, model)}>
                <Mark className="size-4 shrink-0 opacity-80" provider={provider} />
                <span className="min-w-0 flex-1 truncate">{model.name}</span>
                <span className="shrink-0 text-muted-foreground">{provider.name}</span>
              </DropdownMenuCheckItem>
            ))
          ) : (
            <p className="px-2 py-1 text-ui text-muted-foreground">No model matches “{query.trim()}”.</p>
          )
        ) : available.length === 1 ? (
          /* One provider is a list, not a menu of one submenu. */
          available[0]!.models.map((model) => (
            <DropdownMenuCheckItem checked={isChecked(available[0]!, model)} key={model.id} onSelect={() => choose(available[0]!, model)}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{model.name}</span>
                {model.description && <span className="truncate text-ui-sm text-muted-foreground">{model.description}</span>}
              </span>
            </DropdownMenuCheckItem>
          ))
        ) : (
          available.map((provider) => (
            <DropdownMenuSub key={provider.id}>
              <DropdownMenuSubTrigger>
                <Mark className="size-4 shrink-0" provider={provider} />
                <span className="truncate">{provider.name}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[17rem] min-w-[13rem]">
                {provider.models.map((model) => (
                  <DropdownMenuCheckItem checked={isChecked(provider, model)} key={model.id} onSelect={() => choose(provider, model)}>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{model.name}</span>
                      {model.description && <span className="truncate text-ui-sm text-muted-foreground">{model.description}</span>}
                    </span>
                  </DropdownMenuCheckItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}

        {onOpenSettings && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onOpenSettings}>
              <span className="flex-1">Settings</span>
              <ArrowUpRight className="size-3.5 opacity-45" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---- Effort ----------------------------------------------------------------------- */

export type Effort = { id: string; label: string }

export const defaultEfforts: Effort[] = [
  { id: "off", label: "Off" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "xhigh", label: "Extra High" },
]

export type EffortPickerProps = {
  value: string
  onValueChange: (value: string) => void
  efforts?: Effort[]
  /** Shows a Fast mode switch under its own heading when given. */
  fastMode?: boolean
  onFastModeChange?: (enabled: boolean) => void
  /** The key for ⇧⌘ + key, or `false`. Default `"."`. */
  shortcut?: string | false
  /** Default "Effort". */
  label?: string
  align?: "start" | "center" | "end"
  className?: string
}

/**
 * How hard the model thinks. The quieter of the pair: muted at rest against the
 * model's full strength, and it keeps its chevron, because the effort is a
 * setting you change where the model is a fact you read.
 *
 * Fast mode is not a rung on the ladder of efforts but how the same turn is
 * served, so it sits under its own heading with a switch.
 */
export function EffortPicker({
  value,
  onValueChange,
  efforts = defaultEfforts,
  fastMode,
  onFastModeChange,
  shortcut = ".",
  label = "Effort",
  align = "start",
  className,
}: EffortPickerProps) {
  const current = efforts.find((item) => item.id === value) ?? efforts[0]
  const [open, setOpen] = React.useState(false)
  const trigger = useComposerShortcut(shortcut, () => setOpen(true))

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label={label}
            className={cn(quietTrigger, "gap-1 px-0 text-muted-foreground hover:px-2 hover:text-foreground aria-expanded:px-2 aria-expanded:text-foreground", className)}
            ref={trigger}
          >
            <span className="truncate">{current?.label}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {label}
          {shortcut && <TooltipKeys>{chord(shortcut)}</TooltipKeys>}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align={align} className="min-w-[9.5rem]" side="top">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {efforts.map((item) => (
          <DropdownMenuCheckItem checked={item.id === value} key={item.id} onSelect={() => onValueChange(item.id)}>
            <span className="flex-1 truncate">{item.label}</span>
          </DropdownMenuCheckItem>
        ))}

        {fastMode !== undefined && onFastModeChange && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            {/* The whole row toggles and the menu stays open: an 18px switch in
                a 28px row is too small a target, and you are comparing this
                against the efforts right above it. */}
            <DropdownMenuItem
              aria-checked={fastMode}
              onSelect={(event) => {
                event.preventDefault()
                onFastModeChange(!fastMode)
              }}
              role="menuitemcheckbox"
            >
              <span className="flex-1 truncate">Fast mode</span>
              <Switch checked={fastMode} className="pointer-events-none ml-auto" onCheckedChange={onFastModeChange} size="sm" tabIndex={-1} />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---- Context ---------------------------------------------------------------------- */

const UNITS = [
  { suffix: "G", size: 1e9 },
  { suffix: "M", size: 1e6 },
  { suffix: "K", size: 1e3 },
] as const

/** Token counts to their unit: six figures of precision on a number that moves by thousands is noise. */
export function abbreviateTokens(value: number): string {
  const unit = UNITS.find(({ size }) => value >= size)
  return unit ? `${Math.round(value / unit.size)}${unit.suffix}` : `${value}`
}

/**
 * The ring. A 16px box with a 6px radius, so the 2px stroke sits a pixel clear
 * of the edge, started at twelve o'clock. The track is the same stroke at a
 * tenth strength: legible at a glance, not precise.
 */
export function RadialProgress({ percent, className }: { percent: number; className?: string }) {
  const r = 6
  const circumference = 2 * Math.PI * r
  return (
    <svg className={cn("size-4", className)} role="img" viewBox="0 0 16 16">
      <circle cx="8" cy="8" fill="none" opacity="0.1" r={r} stroke="currentColor" strokeWidth="2" />
      <circle
        className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        cx="8"
        cy="8"
        fill="none"
        opacity="0.7"
        r={r}
        stroke="currentColor"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - percent / 100)}
        strokeLinecap="round"
        strokeWidth="2"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
    </svg>
  )
}

/** One line of a usage popover. */
export function UsageRow({ label, value, className }: { label?: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-3 py-1 text-[13px] font-medium", className)}>
      <p className="text-muted-foreground">{label}</p>
      <p className="shrink-0 text-right">{value}</p>
    </div>
  )
}

export type ContextUsageProps = {
  /** Tokens in the context window now. Leave out when there is no reading yet. */
  used?: number
  /** The window's size. */
  total?: number
  /** Subscription quota windows, shown as "N% left" with a warning dot under 30%. */
  quotas?: QuotaWindow[]
  /** The heading over the quota rows: a provider's name and mark. */
  quotaLabel?: React.ReactNode
  /** More rows under the reading, e.g. a subscription's remaining quota. Use `UsageRow`. */
  children?: React.ReactNode
  /** Called each time the popover opens: the cue to fetch anything nothing pushes. */
  onOpen?: () => void
  className?: string
}

/**
 * A ring for how full the context window is, beside the model name, with the
 * numbers behind it on hover. Room below for other readings at another scale:
 * the window is what stops this turn, a quota is what stops the afternoon.
 */
export function ContextUsage({ used, total, quotas = [], quotaLabel, children, onOpen, className }: ContextUsageProps) {
  /* Clamped, not trusted: a prompt reported larger than its window would draw an arc past its circle. */
  const reading = used !== undefined
  const size = total ?? 0
  const percent = Math.max(0, Math.min(100, size > 0 ? ((used ?? 0) / size) * 100 : 0))
  /* Nothing to say yet: no ring, rather than an empty one that reads as a reading. */
  if (!reading && quotas.length === 0 && !children) return null
  return (
    <Tooltip onOpenChange={(open) => open && onOpen?.()}>
      <TooltipTrigger asChild>
        <button
          aria-label="Context usage"
          className={cn(
            "mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground",
            className,
          )}
          type="button"
        >
          <RadialProgress percent={percent} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="min-w-60 flex-col items-stretch gap-0 px-0 py-1.5 tabular-nums">
        {reading && (
          <UsageRow
            className="flex-row-reverse"
            label={size > 0 ? `${abbreviateTokens(used ?? 0)}/${abbreviateTokens(size)} tokens` : undefined}
            value={`${Math.round(percent)}% Full`}
          />
        )}
        {quotas.length > 0 && (
          <>
            {reading && <Separator className="my-1" />}
            {quotaLabel && <div className="flex items-center gap-1 px-3 py-2 text-xs leading-none text-muted-foreground">{quotaLabel}</div>}
            {quotas.map((quota) => (
              <QuotaRow key={quota.label} quota={quota} />
            ))}
          </>
        )}
        {children && (
          <>
            {(reading || quotas.length > 0) && <Separator className="my-1" />}
            {children}
          </>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/** One window of a subscription's quota: "5 hours", "Weekly". */
export type QuotaWindow = { label: string; usedPercent: number }

/**
 * What is left of a quota window. A dot rather than a coloured number — amber
 * under 30%, red under 10% — so two rows of the same kind still read as one kind.
 */
export function QuotaRow({ quota }: { quota: QuotaWindow }) {
  const left = Math.max(100 - Math.round(quota.usedPercent), 0)
  return (
    <UsageRow
      label={quota.label}
      value={
        <>
          {left < 30 && <span className={cn("mr-1 inline-block size-2 shrink-0 rounded-full", left < 10 ? "bg-red-400" : "bg-amber-400")} />}
          {`${left}% left`}
        </>
      }
    />
  )
}

/** The model controls under the composer, held together as one group. */
export function ModelControlGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 items-center gap-0.5", className)}>{children}</div>
}

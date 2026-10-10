import * as React from "react"
import { CornerDownRight, Folder, Search } from "lucide-react"
import { cn } from "../lib/utils"
import { useThreadConfig } from "./config"
import { tokenize } from "./highlight"
import { Inline } from "./markdown"
import { questionExchange, type Exchange as ExchangeData } from "./question-exchange"
import type { ToolKind } from "./tools"
import type { ToolPart } from "./types"

/**
 * What a tool call actually did, drawn rather than dumped: the file it read,
 * the command and what it printed, the sites a search came back with. Picked
 * from the tool's name when no `render` is registered; anything a view cannot
 * read falls back to the raw payload, so a new tool is plain, never broken.
 */

const CAP = 14

const text = (value: unknown): string => (typeof value === "string" ? value : "")
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
const first = (value: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) if (typeof value[key] === "string" && value[key]) return value[key] as string
  return ""
}

const EXTENSIONS: Record<string, string> = {
  ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  py: "python", rb: "ruby", rs: "rust", go: "go", java: "java", kt: "kotlin", swift: "swift", c: "c", h: "c",
  cc: "cpp", cpp: "cpp", hpp: "cpp", cs: "csharp", php: "php", sh: "bash", zsh: "bash", bash: "bash",
  json: "json", yml: "yaml", yaml: "yaml", toml: "toml", css: "css", html: "html", sql: "sql", md: "markdown",
}

/** A language name from a path's extension, for colouring a file. */
export function languageForPath(path: string): string {
  return EXTENSIONS[path.split(".").at(-1)?.toLowerCase() ?? ""] ?? "text"
}

/** The label above a field. One idiom for all of them. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 pt-2 pb-1 text-[length:inherit] font-medium tracking-wide text-muted-foreground uppercase">{children}</p>
}

/** A short aside in a panel: an empty result, a note from the tool. */
export function Note({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 py-2 text-[length:inherit] leading-[1.5] text-muted-foreground/85">{children}</p>
}

function ShowAll({ full, lines, onToggle }: { full: boolean; lines: number; onToggle: () => void }) {
  const { labels } = useThreadConfig()
  return (
    <button
      className="mx-2.5 mb-2 cursor-default rounded-md bg-accent px-2 py-1 text-[length:inherit] text-muted-foreground transition-colors hover:text-foreground"
      onClick={onToggle}
      type="button"
    >
      {full ? labels.collapseOutput : labels.showAllLines(lines)}
    </button>
  )
}

/**
 * Code, capped at fourteen lines and openable: a file the agent read can be
 * four hundred lines, and a transcript that grows a screen every time the
 * agent looks at something is one nobody can scroll.
 */
export function Snippet({ code, language = "text", className }: { code: string; language?: string; className?: string }) {
  const config = useThreadConfig()
  const [full, setFull] = React.useState(false)
  const trimmed = code.replace(/\s+$/, "")
  const tokens = React.useMemo(() => (config.highlight ? null : tokenize(trimmed, language)), [config.highlight, trimmed, language])
  if (!trimmed) return null
  const lines = trimmed.split("\n").length
  return (
    <>
      <pre
        className={cn(
          "op-scroll overflow-x-auto px-2.5 pb-2 font-mono text-[length:inherit] leading-[1.55] text-[var(--code-foreground)]",
          !full && lines > CAP && "max-h-[15.5rem] overflow-y-hidden",
          className,
        )}
      >
        {config.highlight ? (
          config.highlight(trimmed, language)
        ) : (
          <code>
            {tokens!.map((token, index) =>
              token.slot ? (
                <span className={`op-tok-${token.slot}`} key={index}>
                  {token.text}
                </span>
              ) : (
                token.text
              ),
            )}
          </code>
        )}
      </pre>
      {lines > CAP && <ShowAll full={full} lines={lines} onToggle={() => setFull((value) => !value)} />}
    </>
  )
}

/** Plain output — a command's, a page's. Same cap, no grammar. */
export function Lines({ body }: { body: string }) {
  const [full, setFull] = React.useState(false)
  const trimmed = body.replace(/\s+$/, "")
  if (!trimmed) return null
  const lines = trimmed.split("\n").length
  return (
    <>
      <pre
        className={cn(
          "op-scroll overflow-x-auto px-2.5 pb-2 font-mono text-[length:inherit] leading-[1.55] whitespace-pre text-muted-foreground/90",
          !full && lines > CAP && "max-h-[15.5rem] overflow-y-hidden",
        )}
      >
        {trimmed}
      </pre>
      {lines > CAP && <ShowAll full={full} lines={lines} onToggle={() => setFull((value) => !value)} />}
    </>
  )
}

/** A file, headed by its path — clickable, since the next thing after seeing it was read is opening it. */
export function FileView({ path, body, wrote = false }: { path: string; body: string; wrote?: boolean }) {
  const { onOpenFile } = useThreadConfig()
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5 px-2.5 pt-2 pb-1.5">
        <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
        <button
          className="min-w-0 truncate font-mono text-[length:inherit] text-foreground/85 transition-colors enabled:hover:text-foreground enabled:hover:underline"
          disabled={!onOpenFile}
          onClick={() => onOpenFile?.(path)}
          title={path}
          type="button"
        >
          {path}
        </button>
        {wrote && <span className="shrink-0 text-[length:inherit] text-muted-foreground">written</span>}
      </div>
      <Snippet code={body} language={languageForPath(path)} />
    </div>
  )
}

type Entry = { name?: unknown; path?: unknown; type?: unknown }

/** A directory listing, as a column of names. */
export function Listing({ entries, where }: { entries: Array<Entry | string>; where?: string }) {
  const { onOpenFile, labels } = useThreadConfig()
  if (entries.length === 0) return <Note>{labels.noResults}</Note>
  return (
    <div className="min-w-0">
      {where && <Eyebrow>{where}</Eyebrow>}
      <ul className={cn("pb-2", !where && "pt-1.5")}>
        {entries.map((raw, index) => {
          const entry: Entry = typeof raw === "string" ? { name: raw, path: raw, type: raw.endsWith("/") ? "directory" : "file" } : raw
          const path = text(entry.path) || text(entry.name)
          const name = (text(entry.name) || path).replace(/\/$/, "")
          const directory = entry.type === "directory" || entry.type === "dir"
          return (
            <li key={`${path}-${index}`}>
              <button
                className="flex w-full min-w-0 items-center gap-1.5 px-2.5 py-[3px] text-left transition-colors enabled:hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]"
                disabled={directory || !onOpenFile}
                onClick={() => onOpenFile?.(path)}
                type="button"
              >
                {directory ? <Folder className="size-3.5 shrink-0 text-foreground/60" /> : <span className="size-3.5 shrink-0" />}
                <span className={cn("min-w-0 truncate font-mono text-[length:inherit]", directory ? "text-foreground/70" : "text-muted-foreground")}>
                  {name}
                  {directory && "/"}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * A shell command and what it printed, set as a terminal. The exit code is
 * named only when it is not zero — a green 0 on every command is noise.
 */
export function Command({ command, exitCode, output }: { command: string; exitCode?: number | null; output: string }) {
  const { labels } = useThreadConfig()
  const failed = exitCode != null && exitCode !== 0
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-start gap-1.5 px-2.5 pt-2 pb-1.5">
        <span aria-hidden className="mt-px shrink-0 font-mono text-[length:inherit] text-muted-foreground">
          $
        </span>
        <code className="min-w-0 flex-1 font-mono text-[length:inherit] break-all text-foreground/85">{command}</code>
        {failed && (
          <span className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)] px-1.5 py-px text-[length:inherit] font-medium text-destructive">
            {labels.exitCode(exitCode)}
          </span>
        )}
      </div>
      {output.trim() ? <Lines body={output} /> : <Note>{labels.noResults}</Note>}
    </div>
  )
}

export type SearchResult = { url?: string; title?: string; extract?: string; snippet?: string; published?: string }

function resultRows(result: unknown): SearchResult[] {
  const rows = Array.isArray(result) ? result : record(result).results
  return Array.isArray(rows) ? rows.map(record).map((row) => ({ ...row, extract: text(row.extract) || text(row.snippet) || text(row.content) }) as SearchResult) : []
}

/** A web search: the query in something shaped like a search field, then the sites that answered. */
export function WebSearch({ query, results, note }: { query: string; results: SearchResult[]; note?: string }) {
  const { labels } = useThreadConfig()
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2 px-2.5 pt-2.5 pb-1.5">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-accent px-2.5 py-1">
          <Search className="size-3.5 shrink-0 text-muted-foreground/85" strokeWidth={1.8} />
          <span className="min-w-0 truncate text-[length:inherit] text-foreground/90">{query}</span>
        </span>
        {results.length > 0 && (
          <span className="shrink-0 text-[length:inherit] tabular-nums text-muted-foreground">
            {results.length === 1 ? "1 result" : `${results.length} results`}
          </span>
        )}
      </div>
      {note && <Note>{note}</Note>}
      {results.length === 0 && !note && <Note>{labels.noResults}</Note>}
      <ul className="pb-1.5">
        {results.map((row, index) => (
          <li className="min-w-0" key={`${row.url ?? ""}-${index}`}>
            <ResultRow row={row} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Pages read in full: the result rows opened out, with the text the agent read. */
export function WebPages({ urls, results, note }: { urls: string[]; results: SearchResult[]; note?: string }) {
  const missing = urls.filter((url) => !results.some((row) => row.url === url))
  return (
    <div className="min-w-0 pt-1">
      {note && <Note>{note}</Note>}
      {results.map((row, index) => (
        <div className="min-w-0" key={`${row.url ?? ""}-${index}`}>
          {index > 0 && <div className="mx-2.5 border-t border-border/60" />}
          <ResultRow row={row} />
          <Lines body={row.extract ?? ""} />
        </div>
      ))}
      {missing.map((url) => (
        <div className="flex min-w-0 items-center gap-2 px-2.5 py-1.5 text-[length:inherit] text-muted-foreground" key={url}>
          <Favicon host={host(url)} />
          <span className="min-w-0 truncate">{host(url)} returned nothing to read.</span>
        </div>
      ))}
    </div>
  )
}

function ResultRow({ row }: { row: SearchResult }) {
  const { onOpenUrl } = useThreadConfig()
  const url = row.url ?? ""
  const when = published(row.published ?? "")
  const body = (
    <>
      <span className="pt-[0.2rem]">
        <Favicon host={host(url)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block min-w-0 truncate text-[length:inherit] text-foreground/90 group-hover/result:text-foreground">{row.title || url}</span>
        <span className="flex min-w-0 items-baseline gap-1.5 text-[length:inherit] text-muted-foreground">
          <span className="min-w-0 truncate">{host(url)}</span>
          {when && <span className="shrink-0">· {when}</span>}
        </span>
        {row.extract && <span className="mt-0.5 line-clamp-2 text-[length:inherit] leading-[1.5] text-muted-foreground/80">{row.extract}</span>}
      </span>
    </>
  )
  const className = "group/result flex w-full min-w-0 gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-accent"
  if (url && onOpenUrl) {
    return (
      <button className={cn(className, "cursor-default")} onClick={() => onOpenUrl(url)} type="button">
        {body}
      </button>
    )
  }
  if (url && /^https?:/.test(url)) {
    return (
      <a className={className} href={url} rel="noreferrer" target="_blank">
        {body}
      </a>
    )
  }
  return <div className={className}>{body}</div>
}

function published(value: string): string {
  if (!value) return ""
  const at = new Date(value)
  return Number.isNaN(at.getTime()) ? "" : at.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function host(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return url
  }
}

/**
 * A site's own icon: its `/favicon.ico`, then a monogram whose hue comes from
 * the host, so one site keeps one colour. Only the site the result already
 * names is asked — no third-party icon service learns what the agent read.
 */
export function Favicon({ host: site }: { host: string }) {
  const sources = React.useMemo(() => (site && !site.includes("/") ? [`https://${site}/favicon.ico`] : []), [site])
  const [tier, setTier] = React.useState(0)
  React.useEffect(() => setTier(0), [sources])
  const source = sources[tier]
  if (!source) return <Monogram host={site} />
  return <img alt="" className="size-4 shrink-0 rounded-[3px] object-contain" loading="lazy" onError={() => setTier((value) => value + 1)} referrerPolicy="no-referrer" src={source} />
}

function Monogram({ host: site }: { host: string }) {
  const letter = (site.replace(/^www\./, "")[0] ?? "?").toUpperCase()
  let hash = 0
  for (const character of site) hash = (hash * 31 + character.charCodeAt(0)) % 360
  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-[3px] text-[0.5625rem] font-semibold text-white/95" style={{ backgroundColor: `hsl(${hash} 42% 52%)` }}>
      {letter}
    </span>
  )
}

/**
 * A question the agent asked and what was said to it, drawn as the exchange it
 * is: the question in the thread's own type, the answer in a bubble where a
 * user message sits. Choices show only when the answer was not one of them.
 */
export function Exchange({ question, answer, choices }: ExchangeData) {
  const { labels } = useThreadConfig()
  const chosen = choices.some((choice) => answer.split(/,\s*/).some((part) => part.trim().toLowerCase() === choice.toLowerCase()))
  const spare = chosen ? [] : choices
  return (
    <div className="min-w-0">
      <p className="text-thread leading-[1.55] font-medium text-foreground">
        <Inline text={question} />
      </p>
      {spare.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {spare.map((choice, index) => (
            <li className="rounded-[var(--radius-item)] bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] px-1.5 py-[2px] text-thread-tool text-muted-foreground/80" key={`${choice}-${index}`}>
              <Inline text={choice} />
            </li>
          ))}
        </ul>
      )}
      {answer ? (
        <div className="mt-2 flex min-w-0 justify-end">
          <p className="op-bubble max-w-[85%] min-w-0 px-3 py-2 text-thread leading-[1.5] whitespace-pre-wrap text-foreground">
            <Inline text={answer} />
          </p>
        </div>
      ) : (
        <p className="mt-1 text-thread text-muted-foreground/70">{labels.waitingForAnswer}.</p>
      )}
    </div>
  )
}

/** Several exchanges, one under another. */
export function Exchanges({ exchanges }: { exchanges: ExchangeData[] }) {
  return (
    <div className="space-y-4">
      {exchanges.map((exchange, index) => (
        <Exchange key={`${index}-${exchange.question}`} {...exchange} />
      ))}
    </div>
  )
}

/** Tool kinds whose view is conversation rather than payload: drawn without the panel. */
export function isBareKind(kind: ToolKind): boolean {
  return kind === "ask"
}

/**
 * The built-in view for a call, chosen by the kind its name suggests. Returns
 * `undefined` when the arguments do not have what the view needs.
 */
export function defaultToolView(kind: ToolKind, part: ToolPart, input: unknown, output: unknown): React.ReactNode | undefined {
  const args = record(input)
  const result = record(output)
  switch (kind) {
    case "read": {
      const path = first(args, ["path", "file_path", "filePath", "file", "filename"])
      const body = typeof output === "string" ? output : first(result, ["content", "text", "body"])
      return path && body ? <FileView body={body} path={path} /> : undefined
    }
    case "write": {
      const path = first(args, ["path", "file_path", "filePath", "file", "filename"])
      const body = first(args, ["content", "text", "body", "contents"])
      return path && body ? <FileView body={body} path={path} wrote /> : undefined
    }
    case "list": {
      const entries = Array.isArray(output) ? output : Array.isArray(result.entries) ? result.entries : Array.isArray(result.files) ? result.files : null
      return entries ? <Listing entries={entries as Array<Entry | string>} where={first(args, ["path", "directory", "dir", "pattern"])} /> : undefined
    }
    case "run": {
      const command = first(args, ["command", "cmd", "script"])
      if (!command) return undefined
      const code = [result.exitCode, result.exit_code, result.code].find((value) => typeof value === "number") as number | undefined
      const printed = typeof output === "string" ? output : [first(result, ["output", "stdout"]), first(result, ["stderr"])].filter(Boolean).join("\n")
      return <Command command={command} exitCode={code ?? null} output={printed} />
    }
    case "web-search": {
      const query = first(args, ["query", "q", "search"])
      return query ? <WebSearch note={text(result.note)} query={query} results={resultRows(output)} /> : undefined
    }
    case "fetch": {
      const urls = Array.isArray(args.urls) ? args.urls.map(text).filter(Boolean) : [first(args, ["url", "href"])].filter(Boolean)
      if (urls.length === 0) return undefined
      const rows = resultRows(output)
      const pages = rows.length ? rows : typeof output === "string" && urls.length === 1 ? [{ url: urls[0]!, extract: output }] : []
      return <WebPages note={text(result.note)} results={pages} urls={urls} />
    }
    case "ask": {
      const exchanges = questionExchange(part.input, part.output)
      return exchanges.length ? <Exchanges exchanges={exchanges} /> : undefined
    }
    default:
      return undefined
  }
}

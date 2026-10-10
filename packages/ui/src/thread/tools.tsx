import type * as React from "react"
import {
  IconBook,
  IconCheck,
  IconChip,
  IconCode,
  IconDot,
  IconEdit,
  IconFile,
  IconFolder,
  IconGlobe,
  IconList,
  IconPlay,
  IconQuestion,
  IconSearch,
  IconSkill,
  IconSparkle,
  IconTerminal,
} from "./threadIcons"
import type { OrbKind, ToolDefinition, ToolPart, ToolRegistry, ToolRenderProps } from "./types"

/**
 * Types a registry against your own tools without widening it:
 *
 *   const tools = defineTools({
 *     read_file: { icon: IconFile, title: "Read", subject: ({ input }) => input.path },
 *   })
 */
export function defineTools<T extends ToolRegistry>(tools: T): T {
  return tools
}

/** Types one tool's input and output for its callbacks. */
export function defineTool<TInput = unknown, TOutput = unknown>(tool: ToolDefinition<TInput, TOutput>): ToolDefinition<TInput, TOutput> {
  return tool
}

/** The family a tool's name puts it in. Picks the built-in panel when no `render` is registered. */
export type ToolKind =
  | "web-search"
  | "fetch"
  | "read"
  | "list"
  | "search"
  | "write"
  | "edit"
  | "run"
  | "check"
  | "code"
  | "ask"
  | "plan"
  | "memory"
  | "skill"
  | "think"
  | "generate"
  | "update"
  | "other"

type Inferred = {
  kind: ToolKind
  icon: React.ComponentType<{ className?: string }>
  verb: [running: string, done: string]
}

/**
 * What a tool's name says about it.
 *
 * A column of identical marks says only "something happened", which the reader
 * already knows. The mark is what you read before the words, so even an
 * unregistered tool gets one from its name: going out to the network does not
 * look like reading a file, and neither looks like running a command. Names are
 * matched hyphenated and underscored alike.
 */
const RULES: Array<[RegExp, Inferred]> = [
  [/^(web_?search|search_?web)/, { kind: "web-search", icon: IconSearch, verb: ["Searching the web", "Searched the web"] }],
  [/^(web_?fetch|fetch|http|browse|open_?url)/, { kind: "fetch", icon: IconGlobe, verb: ["Fetching", "Fetched"] }],
  [/^(read|view|cat|open)(_?file)?/, { kind: "read", icon: IconFile, verb: ["Reading", "Read"] }],
  [/^(list|ls|glob|find_?files)/, { kind: "list", icon: IconFolder, verb: ["Listing", "Listed"] }],
  [/^(search|grep|find|lookup|query)/, { kind: "search", icon: IconSearch, verb: ["Searching", "Searched"] }],
  [/^(write|create)(_?file)?/, { kind: "write", icon: IconEdit, verb: ["Writing", "Wrote"] }],
  [/^(edit|apply|patch|replace|str_?replace|update_?file)/, { kind: "edit", icon: IconEdit, verb: ["Editing", "Edited"] }],
  [/^(run|exec|bash|shell|terminal|command)/, { kind: "run", icon: IconTerminal, verb: ["Running", "Ran"] }],
  [/^(test|check|verify|lint|typecheck)/, { kind: "check", icon: IconCheck, verb: ["Checking", "Checked"] }],
  [/^(eval|execute_?code|python|code_?interpreter)/, { kind: "code", icon: IconCode, verb: ["Running code", "Ran code"] }],
  [/^(ask|question|request_?input|ask_?user)/, { kind: "ask", icon: IconQuestion, verb: ["Asking", "Asked"] }],
  [/^(plan|todo|task)/, { kind: "plan", icon: IconList, verb: ["Planning", "Planned"] }],
  [/^(remember|memory|record|save_?note|note)/, { kind: "memory", icon: IconBook, verb: ["Remembering", "Remembered"] }],
  [/^(skill|load_?skill)/, { kind: "skill", icon: IconSkill, verb: ["Loading skill", "Loaded skill"] }],
  [/^(think|reflect|analy[sz]e)/, { kind: "think", icon: IconSparkle, verb: ["Analyzing", "Analyzed"] }],
  [/^(generate|draw|render|image|visuali[sz]e)/, { kind: "generate", icon: IconPlay, verb: ["Generating", "Generated"] }],
  [/^(set|propose|commit|update|upsert)/, { kind: "update", icon: IconChip, verb: ["Updating", "Updated"] }],
]

const FALLBACK: Inferred = { kind: "other", icon: IconDot, verb: ["", ""] }

function normalise(name: string): string {
  return name.replace(/-/g, "_").replace(/^(mcp__[^_]+__|functions\.)/, "").toLowerCase()
}

export function inferTool(name: string): Inferred {
  const key = normalise(name)
  return RULES.find(([pattern]) => pattern.test(key))?.[1] ?? FALLBACK
}

/** `read_file` → `Read file`, for a tool nothing else could name. */
export function humanise(name: string): string {
  const words = normalise(name).replace(/_/g, " ").trim()
  return words ? words[0]!.toUpperCase() + words.slice(1) : name
}

const SUBJECT_KEYS = ["path", "file_path", "filePath", "file", "filename", "target", "url", "query", "q", "pattern", "command", "cmd", "name", "title"] as const

/** The one argument a row is usually about, if the input has an obvious one. */
export function inferSubject(input: unknown): string | undefined {
  const value = asObject(input)
  if (!value) return typeof input === "string" && input.length < 80 && !input.includes("\n") ? input : undefined
  for (const key of SUBJECT_KEYS) {
    const entry = value[key]
    if (typeof entry === "string" && entry.trim()) return entry.trim()
  }
  return undefined
}

export function looksLikePath(value: string): boolean {
  return /^[\w@.~-]*[/\\][\w./\\@-]+$/.test(value) || /^[\w-]+\.[a-z0-9]{1,6}$/i.test(value)
}

export function asObject(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed.startsWith("{")) return undefined
    try {
      const parsed: unknown = JSON.parse(trimmed)
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

export type ResolvedTool = {
  definition: ToolDefinition
  kind: ToolKind
  icon: React.ComponentType<{ className?: string }>
  /** The orb a running call spins, when its definition asks for one; otherwise it pulses its own mark. */
  orb: OrbKind | undefined
  title: string
  subject: string | undefined
  detail: string | undefined
  props: ToolRenderProps
}

/** One call, with the registry, the name's own hints and the call's overrides folded together. */
export function resolveTool(part: ToolPart, registry: ToolRegistry): ResolvedTool {
  const definition = registry[part.name] ?? registry[normalise(part.name)] ?? {}
  const inferred = inferTool(part.name)
  const props: ToolRenderProps = {
    part,
    input: parseMaybeJson(part.input),
    output: parseMaybeJson(part.output),
    status: part.status,
  }
  const running = part.status === "running"
  const registered = typeof definition.title === "function" ? definition.title(props) : definition.title
  const verb = running ? inferred.verb[0] : inferred.verb[1]
  const title = part.title ?? registered ?? (verb || humanise(part.name))
  const subject = definition.subject ? definition.subject(props) : verb ? inferSubject(props.input) : undefined
  const detail = part.detail ?? (definition.detail && !running ? definition.detail(props) : undefined)
  return {
    definition,
    kind: inferred.kind,
    icon: definition.icon ?? inferred.icon,
    orb: definition.orb,
    title,
    subject,
    detail,
    props,
  }
}

export function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value
  for (const candidate of [trimmed, closeOff(trimmed)]) {
    try {
      return JSON.parse(candidate)
    } catch {
      /* next */
    }
  }
  return value
}

/**
 * Close a JSON prefix that was cut off mid-stream at its last complete value,
 * so arguments still being written can be drawn as what they are so far.
 */
export function closeOff(body: string): string {
  const stack: string[] = []
  let shut: string[] = []
  let end = -1
  let inString = false
  let escaped = false
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index]
    if (inString) {
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') inString = true
    else if (character === "{" || character === "[") stack.push(character === "{" ? "}" : "]")
    else if (character === "}" || character === "]") {
      stack.pop()
      end = index
      shut = [...stack].reverse()
    }
  }
  return end < 0 ? body : body.slice(0, end + 1) + shut.join("")
}

/** Format a payload for display: strings as they are, everything else as JSON. */
export function formatPayload(value: unknown): string {
  if (value === undefined || value === null) return ""
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2)
      } catch {
        return value
      }
    }
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

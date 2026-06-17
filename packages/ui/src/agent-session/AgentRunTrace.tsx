import { CaretRightIcon, CheckIcon, PencilSimpleLine, TerminalWindowIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { cn } from "../lib/utils";
import type { AgentRunTraceEntry } from "./types";

export type AgentRunTraceProps = {
  state?: "thinking" | "thought";
  entries: AgentRunTraceEntry[];
  durationMs?: number;
  defaultOpen?: boolean;
  className?: string;
};

export function AgentRunTrace({
  state = "thinking",
  entries,
  durationMs,
  defaultOpen = state === "thinking",
  className
}: AgentRunTraceProps) {
  const [open, setOpen] = useState(defaultOpen);
  const disclosureTransition = useFileTreeDisclosureTransition();
  const displayEntries = useMemo(() => compactTraceEntries(entries), [entries]);
  const active = state === "thinking";
  const expandable = displayEntries.length > 1;
  const hasActiveEntry = displayEntries.some((entry) => entry.status === "pending" || entry.status === "running");
  const estimatedMs = durationMs ?? entries.length * 2000;
  const label = active ? "Working" : traceGroupLabel(entries, estimatedMs);

  return (
    <div
      className={cn("group/trace flex w-full flex-col gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-200", className)}
      data-component="agent-run-trace"
      data-active={active || undefined}
    >
      <button
        type="button"
        className={cn(
          "flex w-fit max-w-full items-center gap-1 rounded-md p-0 text-left text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
          expandable ? "cursor-pointer" : "cursor-default"
        )}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <span className={cn("font-medium", active && !hasActiveEntry && "opaline-agent-thinking-shimmer")}>{label}</span>
        {expandable ? <TraceChevron open={open} transition={disclosureTransition} className="opacity-0 transition-opacity group-hover/trace:opacity-100" /> : null}
      </button>

      <AnimatePresence initial={false}>
        {expandable && open ? (
          <motion.div
            key="agent-run-trace-list"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            <div className="flex flex-col gap-2 pl-2 pr-1" data-slot="agent-run-trace-list">
              {displayEntries.map((entry) => <AgentRunTraceRow entry={entry} key={entry.id} />)}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AgentRunTraceRow({ entry, defaultOpen = false }: { entry: AgentRunTraceEntry; defaultOpen?: boolean }) {
  const fileChanges = useMemo(() => readFileChanges(entry), [entry]);
  const commandRun = useMemo(() => readCommandRun(entry), [entry]);
  const [open, setOpen] = useState(defaultOpen || fileChanges.length > 0 || commandRun?.failed === true);
  const disclosureTransition = useFileTreeDisclosureTransition();
  const reasoningText = entry.kind === "thought" ? entry.output : undefined;
  const expandable = Boolean(reasoningText || entry.input || entry.output);
  const active = entry.status === "pending" || entry.status === "running";
  const label = traceRowLabel(entry);
  const title = shouldShowTraceRowTitle(entry, label) ? entry.title : undefined;

  if (fileChanges.length > 0) {
    return (
      <AgentRunFileChangeRow
        changes={fileChanges}
        entry={entry}
        open={open}
        setOpen={setOpen}
        transition={disclosureTransition}
      />
    );
  }

  if (commandRun) {
    return (
      <AgentRunCommandRow
        entry={entry}
        open={open}
        run={commandRun}
        setOpen={setOpen}
        transition={disclosureTransition}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
      <button
        type="button"
        className={cn(
          "inline-flex w-fit max-w-full min-w-0 items-start gap-1.5 rounded-md p-0 text-left text-xs text-muted-foreground outline-none",
          expandable && "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        )}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <span className="min-w-0">
          <span className={cn("font-semibold text-foreground/95", active && "opaline-agent-thinking-shimmer")} data-slot="agent-run-trace-row-label">{label}</span>
          {title ? <span className="ml-1.5 text-muted-foreground" data-slot="agent-run-trace-row-title">{title}</span> : null}
          {entry.subtitle ? <span className="ml-1.5 text-muted-foreground" data-slot="agent-run-trace-row-subtitle">{entry.subtitle}</span> : null}
        </span>
        {expandable ? <TraceChevron open={open} transition={disclosureTransition} className="mt-0.5 opacity-0 transition-opacity group-hover/row:opacity-100" /> : null}
      </button>

      <AnimatePresence initial={false}>
        {expandable && open ? (
          <motion.div
            key={`${entry.id}:details`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            <div className={cn(
              "ml-5",
              reasoningText
                ? "whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground"
                : "flex flex-col gap-2 rounded-md bg-muted/25 p-2 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-border/30"
            )}>
              {reasoningText ? (
                <div data-slot="agent-run-trace-reasoning-text">{reasoningText}</div>
              ) : (
                <>
                  {entry.input ? <TraceDetail label="Input" value={entry.input} /> : null}
                  {entry.output ? <TraceDetail label="Result" value={entry.output} /> : null}
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type CommandRunSummary = {
  command: string;
  cwd?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | string | null;
  failed: boolean;
  blocked: boolean;
  truncated: boolean;
};

function AgentRunCommandRow({
  entry,
  open,
  run,
  setOpen,
  transition
}: {
  entry: AgentRunTraceEntry;
  open: boolean;
  run: CommandRunSummary;
  setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  transition: ReturnType<typeof useFileTreeDisclosureTransition>;
}) {
  const active = entry.status === "pending" || entry.status === "running";
  const label = run.blocked ? "Blocked command" : run.failed ? "Command failed" : "Ran command";
  const statusLabel = run.blocked ? "Blocked" : run.failed ? "Failed" : "Success";
  const output = [
    run.command ? `$ ${run.command}` : "",
    run.cwd ? `# ${run.cwd}` : "",
    run.stdout?.trim() ? run.stdout.trimEnd() : "",
    run.stderr?.trim() ? run.stderr.trimEnd() : "",
    run.truncated ? "... [truncated]" : ""
  ].filter(Boolean).join("\n\n");

  return (
    <div className="flex min-w-0 flex-col gap-1.5 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
      <button
        type="button"
        className="inline-flex w-fit max-w-full min-w-0 items-center gap-2 rounded-md p-0 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <TerminalWindowIcon className="size-3.5 shrink-0" />
        <span className={cn("font-semibold", active && "opaline-agent-thinking-shimmer")}>{label}</span>
        <span className="min-w-0 truncate text-muted-foreground">{run.command}</span>
        <TraceChevron open={open} transition={transition} className="opacity-70" />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key={`${entry.id}:command-run`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="ml-6 max-w-full overflow-hidden rounded-[10px] bg-muted/45 p-3 text-[12px] leading-relaxed text-muted-foreground ring-1 ring-border/30">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-medium text-foreground/80">Shell</span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  run.failed || run.blocked ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {run.failed || run.blocked ? <WarningCircleIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
                  {statusLabel}{run.exitCode != null ? ` (${run.exitCode})` : ""}
                </span>
              </div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-foreground/80">{output || "No output."}</pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TraceChevron({
  className,
  open,
  transition
}: {
  className?: string;
  open: boolean;
  transition: ReturnType<typeof useFileTreeDisclosureTransition>;
}) {
  return (
    <motion.span
      animate={{ rotate: open ? 90 : 0 }}
      className={cn("inline-flex size-3 shrink-0 items-center justify-center", className)}
      initial={false}
      transition={transition}
    >
      <CaretRightIcon className="size-3" />
    </motion.span>
  );
}

type FileChangeSummary = {
  path: string;
  action: "edited" | "wrote" | "changed";
  additions: number;
  deletions: number;
};

function AgentRunFileChangeRow({
  changes,
  entry,
  open,
  setOpen,
  transition
}: {
  changes: FileChangeSummary[];
  entry: AgentRunTraceEntry;
  open: boolean;
  setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  transition: ReturnType<typeof useFileTreeDisclosureTransition>;
}) {
  const active = entry.status === "pending" || entry.status === "running";
  const expandable = changes.length > 0;
  const fileWord = changes.length === 1 ? "file" : "files";
  const label = `${entry.status === "error" ? "Failed editing" : "Edited"} ${changes.length === 1 ? "a" : changes.length} ${fileWord}`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
      <button
        type="button"
        className="inline-flex w-fit max-w-full min-w-0 items-center gap-2 rounded-md p-0 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <PencilSimpleLine className="size-3.5 shrink-0" />
        <span className={cn("font-semibold", active && "opaline-agent-thinking-shimmer")}>{label}</span>
        {expandable ? <TraceChevron open={open} transition={transition} className="opacity-70" /> : null}
      </button>

      <AnimatePresence initial={false}>
        {expandable && open ? (
          <motion.div
            key={`${entry.id}:file-changes`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="ml-6 flex flex-col gap-1.5 pb-1">
              {changes.map((change) => (
                <div key={`${change.action}:${change.path}`} className="flex min-w-0 items-center gap-2 text-sm leading-6">
                  <span className="shrink-0 text-muted-foreground">{change.action === "wrote" ? "Wrote" : "Edited"}</span>
                  <span className="min-w-0 truncate font-medium text-blue-600 dark:text-blue-400">{basename(change.path)}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[13px] tabular-nums">
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">+<RollingTraceNumber value={change.additions} /></span>
                    <span className="inline-flex items-center text-red-600 dark:text-red-400">-<RollingTraceNumber value={change.deletions} /></span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function RollingTraceNumber({ value }: { value: number }) {
  const places = useMemo(() => {
    const digits = Math.max(0, Math.floor(Math.abs(value))).toString();
    return digits.split("").map((_, index) => 10 ** (digits.length - index - 1));
  }, [value]);

  return (
    <span className="relative inline-flex overflow-hidden align-[-0.12em]" style={{ height: 16, lineHeight: 1 }}>
      {places.map((place) => (
        <RollingTraceDigit key={place} height={16} place={place} value={Math.max(0, Math.floor(Math.abs(value)))} />
      ))}
    </span>
  );
}

function RollingTraceDigit({
  height,
  place,
  value
}: {
  height: number;
  place: number;
  value: number;
}) {
  const rounded = Math.floor(value / place);
  const spring = useSpring(rounded, { stiffness: 220, damping: 28, mass: 0.7 });

  useEffect(() => {
    spring.set(rounded);
  }, [rounded, spring]);

  return (
    <span className="relative inline-flex w-[1ch] overflow-hidden" style={{ height, fontVariantNumeric: "tabular-nums" }}>
      {Array.from({ length: 10 }, (_, number) => (
        <RollingTraceDigitValue key={number} height={height} motionValue={spring} number={number} />
      ))}
    </span>
  );
}

function RollingTraceDigitValue({
  height,
  motionValue,
  number
}: {
  height: number;
  motionValue: MotionValue<number>;
  number: number;
}) {
  const y = useTransform(motionValue, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    return (offset > 5 ? offset - 10 : offset) * height;
  });
  const style: CSSProperties = {
    alignItems: "center",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    position: "absolute"
  };
  return <motion.span style={{ ...style, y }}>{number}</motion.span>;
}

function readFileChanges(entry: AgentRunTraceEntry): FileChangeSummary[] {
  if (entry.kind !== "tool" || entry.icon !== "file") return [];
  const parsed = parseTraceJson(entry.output);
  const rawChanges = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { files?: unknown } | null)?.files)
      ? (parsed as { files: unknown[] }).files
      : parsed != null
        ? [parsed]
        : [];
  const changes = rawChanges
    .map((item) => readFileChangeSummary(item, entry))
    .filter((item): item is FileChangeSummary => item != null);
  if (changes.length > 0) return changes;

  const inferredPath = inferPathFromTitle(entry.title);
  if (!inferredPath) return [];
  return [{
    path: inferredPath,
    action: entry.title.toLowerCase().startsWith("wrote") ? "wrote" : "edited",
    additions: 0,
    deletions: 0
  }];
}

function readCommandRun(entry: AgentRunTraceEntry): CommandRunSummary | null {
  if (entry.kind !== "tool" || entry.icon !== "terminal") return null;
  const input = parseTraceJson(entry.input);
  const output = parseTraceJson(entry.output);
  const inputRecord = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const outputRecord = typeof output === "object" && output !== null ? output as Record<string, unknown> : {};
  const command = readString(outputRecord.command) || readString(inputRecord.command) || entry.title;
  const stdout = readString(outputRecord.stdout);
  const stderr = readString(outputRecord.stderr)
    || readString(outputRecord.reason)
    || (entry.status === "error" && !output ? entry.output : undefined);
  const rawStatus = (readString(outputRecord.status) ?? "").toLowerCase();
  const blocked = rawStatus === "blocked";
  const failed = entry.status === "error" || rawStatus === "failed" || blocked;

  return {
    command,
    cwd: readString(outputRecord.cwd) || readString(inputRecord.cwd),
    stdout,
    stderr,
    exitCode: readString(outputRecord.exitCode) || readNumberOrNull(outputRecord.exitCode),
    failed,
    blocked,
    truncated: outputRecord.truncated === true
  };
}

function readFileChangeSummary(value: unknown, entry: AgentRunTraceEntry): FileChangeSummary | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as {
    path?: unknown;
    lineStats?: {
      additions?: unknown;
      deletions?: unknown;
    };
    additions?: unknown;
    deletions?: unknown;
    action?: unknown;
  };
  const path = typeof record.path === "string" && record.path.trim()
    ? record.path
    : inferPathFromTitle(entry.title);
  if (!path) return null;
  return {
    path,
    action: record.action === "wrote" || entry.title.toLowerCase().startsWith("wrote") ? "wrote" : "edited",
    additions: readNumber(record.lineStats?.additions ?? record.additions),
    deletions: readNumber(record.lineStats?.deletions ?? record.deletions)
  };
}

function parseTraceJson(value: string | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function inferPathFromTitle(title: string): string | null {
  const match = title.match(/^(?:edited|wrote|write|changed|created)\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function readNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

function useFileTreeDisclosureTransition() {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.28, bounce: 0.02 };
}

function traceRowLabel(entry: AgentRunTraceEntry): string {
  if (entry.kind === "thought") return "Thinking";
  switch (entry.icon) {
    case "terminal":
      return entry.status === "error" ? "Command failed" : "Ran command";
    case "search":
      return "Searched code";
    case "file":
      if (/\bfiles\b/i.test(entry.title)) return "Changed files";
      if (entry.title.toLowerCase().startsWith("write") || entry.title.toLowerCase().startsWith("wrote")) return "Wrote file";
      return entry.title.toLowerCase().startsWith("edit") ? "Edited file" : "Changed file";
    case "memory":
      return "Updated memory";
    case "read":
      return "Read file";
    default:
      return "Used tool";
  }
}

function shouldShowTraceRowTitle(entry: AgentRunTraceEntry, label: string): boolean {
  if (entry.kind === "thought" || label === entry.title) return false;
  if (entry.icon === "terminal" || entry.icon === "search" || entry.icon === "read") return false;
  return !/^tool\b/i.test(entry.title);
}

function traceGroupLabel(entries: AgentRunTraceEntry[], durationMs: number): string {
  const summary = summarizeTraceGroup(entries);
  if (summary) return summary;
  return `Activity ${formatDuration(durationMs)}`;
}

function summarizeTraceGroup(entries: AgentRunTraceEntry[]): string | null {
  const tools = entries.filter((entry) => entry.kind === "tool");
  if (!tools.length) return null;
  const readCount = tools.filter((entry) => entry.icon === "read").length;
  const searchCount = tools.filter((entry) => entry.icon === "search").length;
  const terminalCount = tools.filter((entry) => entry.icon === "terminal").length;
  const memoryCount = tools.filter((entry) => entry.icon === "memory").length;
  const editedCount = tools.filter((entry) => entry.icon === "file").length;
  const knownCount = readCount + searchCount + terminalCount + memoryCount + editedCount;
  const otherCount = Math.max(0, tools.length - knownCount);
  const segments: string[] = [];

  if (readCount) segments.push(`read ${countLabel(readCount, "file")}`);
  if (searchCount) segments.push(searchCount === 1 ? "searched code" : `searched code ${searchCount} times`);
  if (editedCount) segments.push(`changed ${countLabel(editedCount, "file")}`);
  if (terminalCount) segments.push(`ran ${countLabel(terminalCount, "command")}`);
  if (memoryCount) segments.push(`updated ${countLabel(memoryCount, "memory item")}`);
  if (otherCount) segments.push(`used ${countLabel(otherCount, "tool")}`);

  const sentence = joinNatural(segments);
  return sentence ? sentence.charAt(0).toUpperCase() + sentence.slice(1) : null;
}

function compactTraceEntries(entries: AgentRunTraceEntry[]): AgentRunTraceEntry[] {
  const compacted: AgentRunTraceEntry[] = [];
  let index = 0;

  while (index < entries.length) {
    const entry = entries[index];
    const bucket = traceCompactionBucket(entry);

    if (!bucket) {
      compacted.push(entry);
      index += 1;
      continue;
    }

    const group: AgentRunTraceEntry[] = [entry];
    let nextIndex = index + 1;

    while (nextIndex < entries.length && traceCompactionBucket(entries[nextIndex]) === bucket) {
      group.push(entries[nextIndex]);
      nextIndex += 1;
    }

    compacted.push(group.length > 1 ? compactTraceGroup(bucket, group) : entry);
    index = nextIndex;
  }

  return compacted;
}

function traceCompactionBucket(entry: AgentRunTraceEntry): string | null {
  if (entry.kind !== "tool" || entry.status === "running" || entry.status === "pending") return null;
  if (entry.icon === "file") {
    if (/^(wrote|write|created|changed|edited)\b/i.test(entry.title)) return "file-write";
    return "file-touch";
  }
  if (entry.icon === "read") return "file-read";
  if (entry.icon === "search") return "search";
  return null;
}

function compactTraceGroup(bucket: string, entries: AgentRunTraceEntry[]): AgentRunTraceEntry {
  const titles = entries.map((entry) => entry.title).filter(Boolean);
  const fileChanges = entries.flatMap(readFileChanges);
  const files = titles
    .map((title) => title.replace(/^(wrote|write|created|changed|edited|read)\s+/i, "").trim())
    .filter(Boolean);
  const status = entries.some((entry) => entry.status === "error") ? "error" : "completed";
  const title =
    bucket === "file-read" ? `Read ${countLabel(entries.length, "file")}`
    : bucket === "search" ? (entries.length === 1 ? "Searched code" : `Searched code ${entries.length} times`)
    : bucket === "file-write" ? `Wrote ${countLabel(entries.length, "file")}`
    : `Changed ${countLabel(entries.length, "file")}`;

  return {
    ...entries[0],
    id: `${entries[0].id}:compact:${entries.length}`,
    title,
    subtitle: summarizeTraceTargets(files),
    status,
    input: undefined,
    output: fileChanges.length
      ? JSON.stringify({ files: fileChanges }, null, 2)
      : files.length ? files.map((file) => `- ${file}`).join("\n") : titles.map((item) => `- ${item}`).join("\n")
  };
}

function summarizeTraceTargets(targets: string[]): string | undefined {
  if (!targets.length) return undefined;
  const preview = targets.slice(0, 3).join(", ");
  return targets.length > 3 ? `${preview}, +${targets.length - 3} more` : preview;
}

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function joinNatural(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function TraceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10px] font-semibold">{label}</span>
      <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-foreground/80">{value}</pre>
    </div>
  );
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${Math.round(durationMs / 1_000)}s`;
}

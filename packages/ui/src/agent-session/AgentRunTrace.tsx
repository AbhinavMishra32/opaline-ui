import { CaretRightIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

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
  const active = state === "thinking";
  const expandable = entries.length > 1;
  const hasActiveEntry = entries.some((entry) => entry.status === "pending" || entry.status === "running");
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
        {expandable ? <CaretRightIcon className={cn("size-3 shrink-0 transition-transform opacity-0 group-hover/trace:opacity-100 transition-opacity", open && "rotate-90")} /> : null}
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
              {entries.map((entry) => <AgentRunTraceRow entry={entry} key={entry.id} />)}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AgentRunTraceRow({ entry, defaultOpen = false }: { entry: AgentRunTraceEntry; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const disclosureTransition = useFileTreeDisclosureTransition();
  const reasoningText = entry.kind === "thought" ? entry.output : undefined;
  const expandable = Boolean(reasoningText || entry.input || entry.output);
  const active = entry.status === "pending" || entry.status === "running";
  const label = traceRowLabel(entry);
  const title = shouldShowTraceRowTitle(entry, label) ? entry.title : undefined;

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
        {expandable ? <CaretRightIcon className={cn("mt-0.5 size-3 shrink-0 transition-transform opacity-0 group-hover/row:opacity-100 transition-opacity", open && "rotate-90")} /> : null}
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
      return entry.status === "error" ? "Shell failed" : "Ran shell command";
    case "search":
      return "Searched code";
    case "file":
      return entry.title.toLowerCase().startsWith("edit") ? "Edited file" : "Touched file";
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
  if (editedCount) segments.push(`touched ${countLabel(editedCount, "file")}`);
  if (terminalCount) segments.push(`ran ${countLabel(terminalCount, "shell command")}`);
  if (memoryCount) segments.push(`updated ${countLabel(memoryCount, "memory item")}`);
  if (otherCount) segments.push(`used ${countLabel(otherCount, "tool")}`);

  const sentence = joinNatural(segments);
  return sentence ? sentence.charAt(0).toUpperCase() + sentence.slice(1) : null;
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

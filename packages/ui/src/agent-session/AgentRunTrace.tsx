import { CaretRightIcon } from "@phosphor-icons/react";
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
  const active = state === "thinking";
  const expandable = entries.length > 0;
  const hasActiveEntry = entries.some((entry) => entry.status === "pending" || entry.status === "running");
  const label = active ? "Working" : durationMs ? `Worked for ${formatDuration(durationMs)}` : "Activity";

  return (
    <div
      className={cn("flex w-full flex-col gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-200", className)}
      data-component="agent-run-trace"
      data-active={active || undefined}
    >
      <button
        type="button"
        className={cn(
          "group flex w-fit max-w-full items-center gap-1 rounded-md p-0 text-left text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
          expandable ? "cursor-pointer" : "cursor-default"
        )}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <span className={cn("font-medium", active && !hasActiveEntry && "opaline-agent-thinking-shimmer")}>{label}</span>
        {expandable ? <CaretRightIcon className={cn("size-3 shrink-0 transition-transform", open && "rotate-90")} /> : null}
      </button>

      {expandable && open ? (
        <div className="ml-1.5 flex flex-col gap-2 border-l border-border/70 pl-3 pr-1 animate-in fade-in-0 slide-in-from-top-1 duration-200" data-slot="agent-run-trace-list">
          {entries.map((entry) => <AgentRunTraceRow entry={entry} key={entry.id} />)}
        </div>
      ) : null}
    </div>
  );
}

export function AgentRunTraceRow({ entry, defaultOpen = false }: { entry: AgentRunTraceEntry; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const reasoningText = entry.kind === "thought" ? entry.output : undefined;
  const expandable = Boolean(reasoningText || entry.input || entry.output);
  const active = entry.status === "pending" || entry.status === "running";
  const label = traceRowLabel(entry);
  const title = entry.kind === "thought" || label === entry.title ? undefined : entry.title;

  return (
    <div className="flex min-w-0 flex-col gap-1 animate-in fade-in-0 slide-in-from-left-1 duration-200" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
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
        {expandable ? <CaretRightIcon className={cn("mt-0.5 size-3 shrink-0 transition-transform", open && "rotate-90")} /> : null}
      </button>

      {expandable && open ? (
        <div className={cn(
          "ml-5 animate-in fade-in-0 zoom-in-95 duration-150",
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
      ) : null}
    </div>
  );
}

function traceRowLabel(entry: AgentRunTraceEntry): string {
  if (entry.kind === "thought") return "Thinking";
  switch (entry.icon) {
    case "terminal":
      return "Shell";
    case "search":
      return entry.title.toLowerCase().includes("searched") ? entry.title : "Search";
    case "file":
      return entry.title.toLowerCase().startsWith("edit") ? "Edit" : "File";
    case "memory":
      return "Memory";
    case "read":
      return entry.title.toLowerCase().startsWith("read") ? "Read" : "Read";
    default:
      return "Tool";
  }
}

function TraceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-foreground/80">{value}</pre>
    </div>
  );
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${(durationMs / 1_000).toFixed(durationMs < 10_000 ? 1 : 0)}s`;
}

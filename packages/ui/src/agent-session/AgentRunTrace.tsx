import {
  BookOpenIcon,
  BrainIcon,
  CaretRightIcon,
  CheckCircleIcon,
  DatabaseIcon,
  FileCodeIcon,
  MagnifyingGlassIcon,
  SpinnerIcon,
  TerminalWindowIcon,
  WrenchIcon,
  XCircleIcon
} from "@phosphor-icons/react";
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
        <span className={cn("font-medium", active && "opaline-agent-thinking-shimmer")}>{label}</span>
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

function AgentRunTraceRow({ entry }: { entry: AgentRunTraceEntry }) {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(entry.input || entry.output);
  const active = entry.status === "pending" || entry.status === "running";

  return (
    <div className="flex min-w-0 flex-col gap-1 animate-in fade-in-0 slide-in-from-left-1 duration-200" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
      <button
        type="button"
        className={cn(
          "flex min-w-0 items-start gap-2 rounded-md p-0 text-left text-xs text-muted-foreground outline-none",
          expandable && "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        )}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center">
          <TraceIcon entry={entry} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("font-medium text-foreground/90", active && "opaline-agent-thinking-shimmer")}>{entry.title}</span>
          {entry.subtitle ? <span className="ml-1.5 text-muted-foreground">{entry.subtitle}</span> : null}
        </span>
        {expandable ? <CaretRightIcon className={cn("mt-0.5 size-3 shrink-0 transition-transform", open && "rotate-90")} /> : null}
      </button>

      {expandable && open ? (
        <div className="ml-5 flex flex-col gap-2 rounded-md bg-muted/25 p-2 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-border/30 animate-in fade-in-0 zoom-in-95 duration-150">
          {entry.input ? <TraceDetail label="Input" value={entry.input} /> : null}
          {entry.output ? <TraceDetail label="Result" value={entry.output} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function TraceIcon({ entry }: { entry: AgentRunTraceEntry }) {
  if (entry.status === "error") return <XCircleIcon className="size-3.5 text-destructive" />;
  if (entry.status === "pending" || entry.status === "running") return <SpinnerIcon className="size-3.5 animate-spin" />;
  if (entry.kind === "thought") return <BrainIcon className="size-3.5" />;

  switch (entry.icon) {
    case "read": return <BookOpenIcon className="size-3.5" />;
    case "search": return <MagnifyingGlassIcon className="size-3.5" />;
    case "file": return <FileCodeIcon className="size-3.5" />;
    case "terminal": return <TerminalWindowIcon className="size-3.5" />;
    case "memory": return <DatabaseIcon className="size-3.5" />;
    case "tool": return <WrenchIcon className="size-3.5" />;
    default: return <CheckCircleIcon className="size-3.5" />;
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

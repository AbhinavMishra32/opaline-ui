import { ChevronDown, ChevronRight, LoaderCircle, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "../components/button";
import { cn } from "../lib/utils";
import type {
  AgentSessionActionEntry,
  AgentSessionDockProps,
  AgentSessionMessage,
  AgentSessionMessagePart,
  AgentSessionTimelineRow,
  AgentSessionToolEntry,
  AgentSessionToolStatus
} from "./types";

export function AgentSessionMessageView({ message }: { message: AgentSessionMessage }) {
  if (message.role === "user") {
    return (
      <div data-component="user-message">
        {message.content ? (
          <div data-slot="user-message-body">
            <div data-slot="user-message-text">{message.content}</div>
          </div>
        ) : null}
        {message.meta ? (
          <div data-slot="user-message-copy-wrapper" style={{ opacity: 1, pointerEvents: "auto" }}>
            <span data-slot="user-message-meta-wrap">
              <span data-slot="user-message-meta">{message.meta}</span>
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div data-component="assistant-message">
      {message.parts?.map((part) => (
        <AgentSessionPartView key={part.id} part={part} />
      ))}
      {!message.parts?.length && message.content ? (
        <div data-component="text-part">
          <div data-slot="text-part-body">{message.content}</div>
          {message.meta ? (
            <div data-slot="text-part-copy-wrapper" style={{ opacity: 1, pointerEvents: "auto" }}>
              <span data-slot="text-part-meta">{message.meta}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AgentSessionTimelineRowView({
  row,
  showReasoningSummaries,
}: {
  row: AgentSessionTimelineRow;
  showReasoningSummaries: boolean;
}) {
  if (row.type === "user-message") {
    return (
      <div data-slot="session-turn-message-container" data-previous-user-message={row.previousUserMessage || undefined}>
        <AgentSessionMessageView message={row.message} />
      </div>
    );
  }

  if (row.type === "thinking") {
    return (
      <div data-slot="session-turn-message-container">
        <AgentSessionThinkingRow label={row.label} summary={row.summary} showReasoningSummaries={showReasoningSummaries} />
      </div>
    );
  }

  if (row.type === "assistant-message") {
    return (
      <div data-slot="session-turn-message-container" data-previous-assistant-part={row.previousAssistantPart || undefined}>
        <AgentSessionMessageView message={row.message} />
      </div>
    );
  }

  return (
    <div data-slot="session-turn-message-container" data-previous-assistant-part={row.previousAssistantPart || undefined}>
      <div data-component="assistant-message">
        <AgentSessionPartView part={row.part} />
      </div>
    </div>
  );
}

export function AgentSessionThinkingRow({
  label,
  summary,
  showReasoningSummaries,
}: {
  label: ReactNode;
  summary?: ReactNode;
  showReasoningSummaries: boolean;
}) {
  return (
    <div data-slot="session-turn-thinking" className="space-y-1 text-xs text-muted-foreground">
      <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-2.5 py-1">
        <LoaderCircle className="animate-spin" size={13} />
        <span className="animate-pulse font-medium">{label}</span>
      </div>
      {showReasoningSummaries && summary ? (
        <div className="max-w-[80ch] rounded-md border bg-muted/20 px-3 py-2 text-[11px] leading-relaxed" data-slot="session-turn-thinking-heading">
          {summary}
        </div>
      ) : null}
    </div>
  );
}

export function AgentSessionPartView({ part }: { part: AgentSessionMessagePart }) {
  if (part.type === "text") {
    return (
      <div data-component="text-part">
        <div data-slot="text-part-body">{part.content}</div>
        {part.meta ? (
          <div data-slot="text-part-copy-wrapper" style={{ opacity: 1, pointerEvents: "auto" }}>
            <span data-slot="text-part-meta">{part.meta}</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (part.type === "actions") {
    return <AgentSessionActions actions={part.actions}>{part.content}</AgentSessionActions>;
  }

  if (part.type === "reasoning") {
    return (
      <AgentSessionDisclosure
        active={part.active}
        defaultOpen={part.defaultOpen}
        label={part.label}
        component="reasoning-part"
      >
        {part.content}
      </AgentSessionDisclosure>
    );
  }

  if (part.type === "context") {
    return (
      <AgentSessionToolGroup
        active={part.active}
        activeLabel={part.activeLabel}
        doneLabel={part.doneLabel}
        entries={part.entries}
        defaultOpen={part.defaultOpen}
        summary={part.summary}
      />
    );
  }

  return <AgentSessionToolCard tool={part.tool} />;
}

export function AgentSessionActions({
  actions,
  children,
}: {
  actions?: AgentSessionActionEntry[];
  children?: ReactNode;
}) {
  if (!children && !actions?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-component="agent-session-actions">
      {children}
      {actions?.map((action) => (
        <Button
          key={action.id}
          type="button"
          size="sm"
          variant={action.variant ?? "secondary"}
          disabled={action.disabled}
          onClick={action.onSelect}
        >
          {action.icon}
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

export function AgentSessionToolGroup({
  active,
  activeLabel,
  doneLabel,
  summary,
  entries,
  defaultOpen,
}: {
  active?: boolean;
  activeLabel?: ReactNode;
  doneLabel?: ReactNode;
  summary?: ReactNode;
  entries: AgentSessionToolEntry[];
  defaultOpen?: boolean;
}) {
  const label = active
    ? (activeLabel ?? "Gathering context")
    : (doneLabel ?? "Gathered context");

  return (
    <AgentSessionDisclosure
      active={active}
      defaultOpen={defaultOpen}
      label={label}
      component="context-tool-group"
      summary={summary}
    >
      <div data-component="context-tool-group-list">
        {entries.map((entry) => (
          <AgentSessionToolEntryRow entry={entry} key={entry.id} />
        ))}
      </div>
    </AgentSessionDisclosure>
  );
}

export function AgentSessionDisclosure({
  active,
  component,
  label,
  summary,
  defaultOpen = false,
  children,
}: {
  active?: boolean;
  component: "reasoning-part" | "context-tool-group";
  label: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const expandable = children != null;

  return (
    <div data-component={component}>
      <button
        className="flex w-full items-start justify-between gap-3 rounded-md py-1 text-left text-xs text-muted-foreground hover:text-foreground"
        type="button"
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <span className="min-w-0" data-slot="context-tool-group-title">
          <span className={cn("flex items-center gap-1.5 font-medium", active && "animate-pulse")} data-slot="context-tool-group-label">
            {active ? <LoaderCircle className="animate-spin" size={14} /> : <Sparkles size={14} />}
            {label}
          </span>
          {summary ? <span className="mt-0.5 block text-[11px]" data-slot="context-tool-group-summary">{summary}</span> : null}
        </span>
        {expandable ? <ChevronRight className={cn("shrink-0 transition-transform", open && "rotate-90")} size={14} /> : null}
      </button>
      {expandable && open ? children : null}
    </div>
  );
}

export function AgentSessionToolEntryRow({ entry }: { entry: AgentSessionToolEntry }) {
  return (
    <div data-slot="context-tool-group-item" className="rounded-md px-2 py-1.5 text-xs hover:bg-muted/40">
      <AgentSessionToolTrigger entry={entry} />
    </div>
  );
}

export function AgentSessionToolCard({ tool }: { tool: AgentSessionToolEntry }) {
  const [open, setOpen] = useState(tool.defaultOpen ?? false);
  const expandable = tool.content != null;
  const statusLabel = useMemo(() => {
    if (tool.status === "pending" || tool.status === "running") return "Running";
    if (tool.status === "error") return "Failed";
    return "Done";
  }, [tool.status]);

  return (
    <div data-component="tool-part-wrapper">
      <div className="overflow-hidden rounded-lg border bg-card">
        <button
          className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50"
          type="button"
          aria-expanded={expandable ? open : undefined}
          onClick={() => expandable && setOpen((value) => !value)}
        >
          <AgentSessionToolTrigger entry={tool} />
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <small className="text-[10px]">{statusLabel}</small>
            {expandable ? <ChevronRight className={cn("transition-transform", open && "rotate-90")} size={14} /> : null}
          </span>
        </button>
        {expandable && open ? <div className="border-t p-3 text-xs">{tool.content}</div> : null}
      </div>
    </div>
  );
}

export function AgentSessionDock({
  title,
  description,
  preview,
  actions,
  defaultCollapsed = false,
  children,
  className = "",
  ...props
}: AgentSessionDockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const expandable = children != null;

  return (
    <div
      className={cn("overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      data-component="agent-session-dock"
      data-collapsed={collapsed || undefined}
      {...props}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        aria-expanded={expandable ? !collapsed : undefined}
        onClick={() => expandable && setCollapsed((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">{title}</span>
          {description ? <span className="block truncate text-[11px] text-muted-foreground">{description}</span> : null}
          {collapsed && preview ? <span className="block truncate text-[11px] text-muted-foreground">{preview}</span> : null}
        </span>
        {expandable ? <ChevronDown className={cn("shrink-0 transition-transform", collapsed && "rotate-180")} size={14} /> : null}
      </button>
      {expandable && !collapsed ? <div className="border-t px-3 py-2 text-xs">{children}</div> : null}
      {actions?.length ? (
        <div className="flex justify-end gap-2 border-t px-3 py-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant={action.variant ?? "secondary"}
              disabled={action.disabled}
              onClick={action.onSelect}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AgentSessionToolTrigger({ entry }: { entry: AgentSessionToolEntry }) {
  return (
    <div data-component="tool-trigger">
      <div data-slot="basic-tool-tool-trigger-content">
        <div data-slot="basic-tool-tool-info">
          <div data-slot="basic-tool-tool-info-structured">
            <div data-slot="basic-tool-tool-info-main" className="flex min-w-0 flex-col gap-0.5">
              <span data-slot="basic-tool-tool-title" className={cn("min-w-0 truncate text-xs font-medium", isActive(entry.status) && "animate-pulse")}>
                {entry.title}
              </span>
              {entry.subtitle ? <span data-slot="basic-tool-tool-subtitle" className="min-w-0 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{entry.subtitle}</span> : null}
              {entry.args?.map((arg, index) => <span data-slot="basic-tool-tool-arg" className="min-w-0 truncate text-[11px] text-muted-foreground" key={index}>{arg}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isActive(status?: AgentSessionToolStatus) {
  return status === "pending" || status === "running";
}

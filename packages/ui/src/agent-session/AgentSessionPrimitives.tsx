import { CaretDownIcon, CaretRightIcon, MagnifyingGlassIcon, SpinnerIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "../components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/utils";
import { AgentRunTrace, AgentRunTraceRow } from "./AgentRunTrace";
import type { AgentRunTraceEntry } from "./types";
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
      <div className="group/user-message flex flex-col items-end gap-px" data-component="user-message">
        {message.content ? (
          <div data-slot="user-message-body">
            <div data-slot="user-message-text">{message.content}</div>
          </div>
        ) : null}
        {message.meta ? (
          <div className="flex items-center justify-end pr-0.5 text-muted-foreground/45 opacity-0 transition-opacity group-hover/user-message:opacity-100 group-focus-within/user-message:opacity-100" data-slot="user-message-copy-wrapper">
            <span data-slot="user-message-meta-wrap">
              <span data-slot="user-message-meta">{message.meta}</span>
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="group/assistant-message" data-component="assistant-message">
      {message.parts?.map((part) => (
        <AgentSessionPartView key={part.id} part={part} />
      ))}
      {!message.parts?.length && message.content ? (
        <div data-component="text-part">
          <div data-slot="text-part-body">{message.content}</div>
          {message.meta ? (
            <div className="opacity-0 transition-opacity group-hover/assistant-message:opacity-100 group-focus-within/assistant-message:opacity-100" data-slot="text-part-copy-wrapper">
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
      <div className="flex flex-col" data-slot="session-turn-message-container" data-previous-user-message={row.previousUserMessage || undefined}>
        <AgentSessionMessageView message={row.message} />
      </div>
    );
  }

  if (row.type === "thinking") {
    return (
      <div className={cn("flex flex-col", row.summary && "gap-1")} data-slot="session-turn-message-container">
        <AgentSessionThinkingRow label={row.label} summary={row.summary} showReasoningSummaries={showReasoningSummaries} />
      </div>
    );
  }

  if (row.type === "assistant-message") {
    return (
      <div className={cn("flex flex-col", row.previousAssistantPart && "-mt-2")} data-slot="session-turn-message-container" data-previous-assistant-part={row.previousAssistantPart || undefined}>
        <AgentSessionMessageView message={row.message} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", row.previousAssistantPart && "-mt-2")} data-slot="session-turn-message-container" data-previous-assistant-part={row.previousAssistantPart || undefined}>
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
    <div data-slot="session-turn-thinking" className="flex w-fit max-w-full flex-col gap-1 text-[length:var(--app-font-size-chat,12px)] text-muted-foreground/70">
      <div className="inline-flex items-center gap-2">
        <SpinnerIcon className="size-3 animate-spin" />
        <span>{label}</span>
      </div>
      {showReasoningSummaries && summary ? (
        <div className="max-w-[80ch] pl-5 text-[11px] leading-relaxed text-muted-foreground/65" data-slot="session-turn-thinking-heading">
          {summary}
        </div>
      ) : null}
    </div>
  );
}

export function AgentSessionPartView({ part }: { part: AgentSessionMessagePart }) {
  let content: ReactNode = null;
  if (part.type === "text") {
    content = (
      <div data-component="text-part">
        <div data-slot="text-part-body">{part.content}</div>
        {part.meta ? (
          <div className="opacity-0 transition-opacity group-hover/assistant-message:opacity-100 group-focus-within/assistant-message:opacity-100" data-slot="text-part-copy-wrapper">
            <span data-slot="text-part-meta">{part.meta}</span>
          </div>
        ) : null}
      </div>
    );
  } else if (part.type === "actions") {
    content = <AgentSessionActions actions={part.actions}>{part.content}</AgentSessionActions>;
  } else if (part.type === "reasoning") {
    content = (
      <AgentSessionDisclosure
        active={part.active}
        defaultOpen={part.defaultOpen}
        label={part.label}
        component="reasoning-part"
      >
        {part.content}
      </AgentSessionDisclosure>
    );
  } else if (part.type === "context") {
    content = (
      <AgentSessionToolGroup
        active={part.active}
        activeLabel={part.activeLabel}
        doneLabel={part.doneLabel}
        entries={part.entries}
        defaultOpen={part.defaultOpen}
        summary={part.summary}
      />
    );
  } else if (part.type === "activity") {
    content = (
      <div className="pl-1 pr-1" data-component="activity-part">
        <AgentRunTraceRow entry={part.entry} defaultOpen={part.defaultOpen} onOpenFile={part.onOpenFile}/>
      </div>
    );
  } else {
    content = <AgentSessionToolCard tool={part.tool} />;
  }

  return (
    <div id={part.id} className="min-w-0 w-full">
      {content}
    </div>
  );
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
    <div className="flex flex-wrap items-center gap-1.5 pt-1" data-component="agent-session-actions">
      {children}
      {actions?.map((action) => {
        const button = (
          <Button
          key={action.id}
          type="button"
          size="sm"
          variant={action.variant ?? "outline"}
          disabled={action.disabled}
          onClick={action.onSelect}
        >
          {action.icon}
          <span>{action.label}</span>
          </Button>
        );

        return action.description ? (
          <Tooltip key={action.id}>
            <TooltipTrigger render={button} />
            <TooltipContent>{action.description}</TooltipContent>
          </Tooltip>
        ) : button;
      })}
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
    component: "reasoning-part" | "context-tool-group" | "tool-part-wrapper";
  label: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const expandable = children != null;
  const disclosureTransition = useFileTreeDisclosureTransition();

  return (
    <div data-component={component}>
      <button
        className="flex w-fit max-w-full items-start justify-between gap-3 py-0.5 text-left text-[length:var(--app-font-size-chat,12px)] text-muted-foreground/70 transition-colors hover:text-foreground"
        type="button"
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <span className="min-w-0" data-slot="context-tool-group-title">
          <span className={cn("flex items-center gap-1.5 font-medium", active && "animate-pulse")} data-slot="context-tool-group-label">
            {active ? <SpinnerIcon className="size-3.5 animate-spin" /> : <MagnifyingGlassIcon className="size-3.5" />}
            {label}
          </span>
          {summary ? <span className="mt-0.5 block text-[11px] leading-snug" data-slot="context-tool-group-summary">{summary}</span> : null}
        </span>
        {expandable ? <CaretRightIcon className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")} /> : null}
      </button>
      <AnimatePresence initial={false}>
        {expandable && open ? (
          <motion.div
            key="agent-session-disclosure-content"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AgentSessionToolEntryRow({ entry }: { entry: AgentSessionToolEntry }) {
  return (
    <div data-slot="context-tool-group-item" className="py-1 pl-2 text-xs">
      <AgentSessionToolTrigger entry={entry} />
    </div>
  );
}

export function AgentSessionToolCard({ tool }: { tool: AgentSessionToolEntry }) {
  const expandable = tool.content != null;
  const statusLabel = useMemo(() => {
    if (tool.status === "pending" || tool.status === "running") return "Running";
    if (tool.status === "error") return "Failed";
    return "Done";
  }, [tool.status]);

  return (
    <AgentSessionDisclosure
      component="tool-part-wrapper"
      defaultOpen={tool.defaultOpen}
      label={tool.title}
      summary={<>{statusLabel}{tool.subtitle ? <> · {tool.subtitle}</> : null}</>}
    >
      {expandable ? <div className="pb-1 pl-3 pt-2 text-xs">{tool.content}</div> : null}
    </AgentSessionDisclosure>
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
  const disclosureTransition = useFileTreeDisclosureTransition();

  return (
    <div
      className={cn("overflow-hidden rounded-[18px] bg-card/80 text-card-foreground shadow-[0_6px_18px_color-mix(in_srgb,var(--foreground)_5%,transparent)] dark:shadow-none ring-1 ring-border/35", className)}
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
        {expandable ? <CaretDownIcon className={cn("size-3.5 shrink-0 transition-transform", collapsed && "rotate-180")} /> : null}
      </button>
      <AnimatePresence initial={false}>
        {expandable && !collapsed ? (
          <motion.div
            key="agent-session-dock-content"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            <div className="px-3 pb-2 pt-1 text-xs">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {actions?.length ? (
        <div className="flex justify-end gap-2 px-3 pb-2 pt-1">
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

function useFileTreeDisclosureTransition() {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.28, bounce: 0.02 };
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

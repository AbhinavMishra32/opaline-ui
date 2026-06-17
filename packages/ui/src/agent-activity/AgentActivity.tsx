import { AlertCircle, Check, ChevronRight, Circle, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { HTMLAttributes, ReactNode } from "react";
import { memo, useState } from "react";
import { cn } from "../lib/utils";

export type AgentActivityStatus = "pending" | "active" | "complete" | "warning" | "error";

export type AgentActivityEntry = {
  id: string;
  title: ReactNode;
  detail?: ReactNode;
  status?: AgentActivityStatus;
  icon?: ReactNode;
  meta?: ReactNode;
};

export type AgentThinkingProps = Omit<HTMLAttributes<HTMLDivElement>, "content"> & {
  state?: "thinking" | "thought";
  label?: ReactNode;
  content?: ReactNode;
  defaultOpen?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export const AgentThinking = memo(function AgentThinking({
  state = "thinking",
  label,
  content,
  defaultOpen = false,
  expanded,
  onExpandedChange,
  className = "",
  ...props
}: AgentThinkingProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = expanded !== undefined;
  const isOpen = isControlled ? expanded : internalOpen;
  const expandable = content != null;
  const disclosureTransition = useFileTreeDisclosureTransition();

  function toggle() {
    if (!expandable) return;
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onExpandedChange?.(next);
  }

  return (
    <div className={cn("text-xs text-muted-foreground", className)} data-state={state} {...props}>
      <button className="flex items-center gap-1.5 rounded-md py-1 text-left hover:text-foreground disabled:pointer-events-none" type="button" onClick={toggle} disabled={!expandable} aria-expanded={expandable ? isOpen : undefined}>
        <span className={cn(state === "thinking" && "animate-pulse")}>{label ?? (state === "thinking" ? "Thinking" : "Thought")}</span>
        {expandable ? <ChevronRight size={13} className={cn("transition-transform", isOpen && "rotate-90")} /> : null}
      </button>
      <AnimatePresence initial={false}>
        {expandable && isOpen ? (
          <motion.div
            key="agent-thinking-content"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            <div className="border-l pl-3 text-foreground">{content}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

export type AgentActivityProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  detail?: ReactNode;
  status?: Exclude<AgentActivityStatus, "pending">;
  entries?: AgentActivityEntry[];
  defaultOpen?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export type AgentActivityListProps = HTMLAttributes<HTMLDivElement> & {
  entries: AgentActivityEntry[];
};

export function AgentActivityList({ entries, className = "", ...props }: AgentActivityListProps) {
  return (
    <div className={cn("space-y-2 border-l pl-4", className)} {...props}>
      {entries.map((entry) => {
        const entryStatus = entry.status ?? "pending";
        return (
          <div className="flex gap-2 text-xs" data-status={entryStatus} key={entry.id}>
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground data-[status=error]:text-destructive data-[status=warning]:text-destructive">{entry.icon ?? activityIcon(entryStatus)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <strong className={cn("font-medium", entryStatus === "active" && "animate-pulse")}>{entry.title}</strong>
                {entry.meta ? <span className="shrink-0 text-muted-foreground">{entry.meta}</span> : null}
              </div>
              {entry.detail ? <p className="mt-0.5 text-muted-foreground">{entry.detail}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AgentActivity({
  label,
  detail,
  status = "active",
  entries = [],
  defaultOpen = false,
  expanded,
  onExpandedChange,
  className = "",
  ...props
}: AgentActivityProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = expanded !== undefined;
  const isOpen = isControlled ? expanded : internalOpen;
  const expandable = entries.length > 0;
  const disclosureTransition = useFileTreeDisclosureTransition();

  function toggle() {
    if (!expandable) return;
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onExpandedChange?.(next);
  }

  return (
    <div className={cn("space-y-2", className)} data-status={status} {...props}>
      <button className="flex w-full items-center gap-2 rounded-md py-1 text-left disabled:pointer-events-none" type="button" onClick={toggle} disabled={!expandable} aria-expanded={expandable ? isOpen : undefined}>
        <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground data-[status=error]:text-destructive data-[status=warning]:text-destructive">{activityIcon(status)}</span>
        <span className="min-w-0 flex-1">
          <strong className={cn("block truncate text-xs font-medium", status === "active" && "animate-pulse")}>{label}</strong>
          {detail ? <small className="block truncate text-[11px] text-muted-foreground">{detail}</small> : null}
        </span>
        {expandable ? <ChevronRight size={14} className={cn("shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-90")} /> : null}
      </button>
      <AnimatePresence initial={false}>
        {expandable && isOpen ? (
          <motion.div
            key="agent-activity-list"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            <AgentActivityList entries={entries} />
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

export type AgentSuggestionProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
  onAction?: () => void;
  disabled?: boolean;
};

export function AgentSuggestion({ title, description, actionLabel = "Apply", onAction, disabled, className = "", ...props }: AgentSuggestionProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-lg border bg-card p-3", className)} {...props}>
      <div className="min-w-0"><strong className="text-sm font-medium">{title}</strong>{description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}</div>
      {onAction ? <button className="h-7 shrink-0 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50" type="button" disabled={disabled} onClick={onAction}>{actionLabel}</button> : null}
    </div>
  );
}

function activityIcon(status: AgentActivityStatus): ReactNode {
  if (status === "complete") return <Check size={12} />;
  if (status === "active") return <LoaderCircle className="animate-spin" size={12} />;
  if (status === "warning" || status === "error") return <AlertCircle size={12} />;
  return <Circle size={7} />;
}

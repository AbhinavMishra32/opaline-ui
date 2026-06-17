import { ArrowUpIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "../components/button";
import { Textarea } from "../components/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/utils";
import { AgentRunTrace } from "./AgentRunTrace";
import { AgentSessionTimelineRowView } from "./AgentSessionPrimitives";
import { buildAgentSessionTimeline } from "./timeline";
import type {
  AgentRunTraceEntry,
  AgentSessionComposerProps,
  AgentSessionSurfaceProps,
  AgentSessionTimelineProps,
  AgentSessionTimelineRow
} from "./types";

export { AgentRunTrace } from "./AgentRunTrace";
export { buildAgentSessionTimeline } from "./timeline";
export {
  AgentSessionActions,
  AgentSessionDisclosure,
  AgentSessionDock,
  AgentSessionMessageView,
  AgentSessionPartView,
  AgentSessionThinkingRow,
  AgentSessionTimelineRowView,
  AgentSessionToolCard,
  AgentSessionToolEntryRow,
  AgentSessionToolGroup
} from "./AgentSessionPrimitives";
export type {
  AgentSessionActionEntry,
  AgentSessionComposerProps,
  AgentSessionDockAction,
  AgentSessionDockProps,
  AgentSessionMessage,
  AgentSessionMessagePart,
  AgentSessionSurfaceProps,
  AgentSessionTimelineProps,
  AgentSessionTimelineRow,
  AgentSessionToolEntry,
  AgentSessionToolStatus,
  AgentRunTraceEntry
} from "./types";

export function AgentSessionSurface({
  eyebrow,
  title,
  lead,
  messages,
  rows,
  composer,
  emptyState,
  showReasoningSummaries,
  scrollKey,
  className = "",
  ...props
}: AgentSessionSurfaceProps) {
  const header = (eyebrow != null || title != null || lead != null) ? (
    <header
      className="mb-4 rounded-[16px] bg-muted/25 px-3 py-2 ring-1 ring-border/30"
      data-component="agent-session-header"
    >
      {eyebrow != null ? <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p> : null}
      {title != null ? <h3 className="mt-1 text-sm font-semibold">{title}</h3> : null}
      {lead != null ? <div className="mt-1.5 text-[13px] leading-5 text-foreground/90">{lead}</div> : null}
    </header>
  ) : null;

  return (
    <section className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground", className)} {...props}>
      <AgentSessionTimeline
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        header={header}
        messages={messages}
        rows={rows}
        emptyState={emptyState}
        showReasoningSummaries={showReasoningSummaries}
        scrollKey={scrollKey}
      />

      {composer ? <div className="shrink-0 bg-background/70 px-3 pb-3 pt-2 backdrop-blur">{composer}</div> : null}
    </section>
  );
}

export function AgentSessionTimeline({
  header,
  messages,
  rows,
  emptyState,
  showReasoningSummaries = false,
  scrollKey,
  className = "",
  ...props
}: AgentSessionTimelineProps) {
  const rawTimelineRows = rows ?? buildAgentSessionTimeline(messages);
  const timelineRows = useMemo(() => groupConsecutiveActivityRows(rawTimelineRows), [rawTimelineRows]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !shouldFollowRef.current) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [scrollKey, timelineRows.length]);

  return (
    <div
      ref={scrollRef}
      className={cn("px-4 pb-6 pt-3 [&_[data-slot=session-turn-content]]:mx-auto [&_[data-slot=session-turn-content]]:w-full [&_[data-slot=session-turn-content]]:max-w-[780px] [&_[data-component=assistant-message]]:flex [&_[data-component=assistant-message]]:flex-col [&_[data-component=assistant-message]]:gap-2.5 [&_[data-component=text-part]]:text-[13px] [&_[data-slot=text-part-body]]:leading-[1.6] [&_[data-component=user-message]]:ml-auto [&_[data-component=user-message]]:max-w-[77%] [&_[data-slot=user-message-body]]:rounded-[18px] [&_[data-slot=user-message-body]]:bg-muted/70 [&_[data-slot=user-message-body]]:px-3 [&_[data-slot=user-message-body]]:py-2 [&_[data-slot=user-message-body]]:ring-1 [&_[data-slot=user-message-body]]:ring-border/35 [&_[data-slot=user-message-text]]:whitespace-pre-wrap [&_[data-slot=user-message-text]]:break-words [&_[data-slot=user-message-text]]:text-[13px] [&_[data-slot=user-message-text]]:leading-5 [&_[data-slot=text-part-meta]]:mt-2 [&_[data-slot=text-part-meta]]:inline-flex [&_[data-slot=text-part-meta]]:w-fit [&_[data-slot=text-part-meta]]:rounded-full [&_[data-slot=text-part-meta]]:bg-muted/40 [&_[data-slot=text-part-meta]]:px-2 [&_[data-slot=text-part-meta]]:py-0.5 [&_[data-slot=text-part-meta]]:text-[10px] [&_[data-slot=text-part-meta]]:leading-4 [&_[data-slot=text-part-meta]]:text-muted-foreground", className)}
      data-component="agent-session-timeline"
      {...props}
      onScroll={(event) => {
        const element = event.currentTarget;
        shouldFollowRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        props.onScroll?.(event);
      }}
    >
      {header}
      {timelineRows.length === 0 ? (
        emptyState ? <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">{emptyState}</div> : null
      ) : (
        <div data-component="session-turn">
          <div data-slot="session-turn-content">
            <div className="flex flex-col gap-4" data-slot="session-turn-message-container">
              {timelineRows.map((group) => {
                if (group.kind === "activity-group") {
                  if (group.entries.length === 1) {
                    const row = group.rows[0];
                    return (
                      <div key={row.id} className="flex flex-col pl-1 pr-1" data-slot="session-turn-message-container">
                        <AgentSessionTimelineRowView row={row} showReasoningSummaries={showReasoningSummaries} />
                      </div>
                    );
                  }
                  const hasActive = group.entries.some((e) => e.status === "running" || e.status === "pending");
                  return (
                    <div key={group.rows[0].id} className="pl-1 pr-1" data-slot="session-turn-message-container">
                      <AgentRunTrace
                        state={hasActive ? "thinking" : "thought"}
                        entries={group.entries}
                        defaultOpen={false}
                      />
                    </div>
                  );
                }
                return <AgentSessionTimelineRowView key={group.row.id} row={group.row} showReasoningSummaries={showReasoningSummaries} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentSessionComposer({
  value,
  onValueChange,
  onSubmit,
  submitLabel = "Send",
  footerStart,
  placeholder = "Answer in your own words...",
  pending = false,
  disabled = false,
  className = "",
  ...props
}: AgentSessionComposerProps) {
  const isDisabled = disabled || pending || !value.trim();
  const accessibleSubmitLabel = typeof submitLabel === "string" ? submitLabel : "Send";

  return (
    <div className={cn("mx-auto w-full max-w-[840px] overflow-hidden rounded-3xl bg-card shadow-[0_8px_24px_color-mix(in_srgb,var(--foreground)_6%,transparent)] ring-1 ring-border/65 transition-[box-shadow,background-color] focus-within:ring-ring/70", className)}>
      <Textarea
        {...props}
        className="min-h-16 max-h-36 resize-none border-0 bg-transparent px-4 pb-1 pt-3 text-[13px] leading-5 shadow-none focus-visible:border-transparent focus-visible:ring-0"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (event.defaultPrevented || event.nativeEvent.isComposing) return;
          if (event.key === "Enter" && !event.shiftKey && !isDisabled) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        spellCheck
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-0.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">{footerStart}</div>
        <Tooltip>
          <TooltipTrigger
            render={(
              <Button
                aria-label={pending ? "Construct Interact is thinking" : accessibleSubmitLabel}
                className="rounded-full"
                type="button"
                size="icon-lg"
                disabled={isDisabled}
                onClick={onSubmit}
              >
                {pending ? <SpinnerIcon className="animate-spin" /> : <ArrowUpIcon weight="bold" />}
              </Button>
            )}
          />
          <TooltipContent>{pending ? "Thinking" : `${accessibleSubmitLabel} (Enter)`}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

type TimelineRowGroup =
  | { kind: "single"; row: AgentSessionTimelineRow }
  | { kind: "activity-group"; rows: AgentSessionTimelineRow[]; entries: AgentRunTraceEntry[] };

function isActivityPartRow(row: AgentSessionTimelineRow): row is Extract<AgentSessionTimelineRow, { type: "assistant-part" }> & { part: { type: "activity"; entry: AgentRunTraceEntry } } {
  return row.type === "assistant-part" && row.part.type === "activity";
}

function groupConsecutiveActivityRows(rows: AgentSessionTimelineRow[]): TimelineRowGroup[] {
  const groups: TimelineRowGroup[] = [];
  let i = 0;

  while (i < rows.length) {
    const row = rows[i];
    if (isActivityPartRow(row)) {
      const activityRows: AgentSessionTimelineRow[] = [row];
      const entries: AgentRunTraceEntry[] = [row.part.entry];
      let j = i + 1;
      while (j < rows.length) {
        const nextRow = rows[j];
        if (!isActivityPartRow(nextRow)) break;
        activityRows.push(nextRow);
        entries.push(nextRow.part.entry);
        j++;
      }
      groups.push({ kind: "activity-group", rows: activityRows, entries });
      i = j;
    } else {
      groups.push({ kind: "single", row });
      i++;
    }
  }

  return groups;
}

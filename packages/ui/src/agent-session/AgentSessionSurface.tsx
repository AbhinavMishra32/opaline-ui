import { ArrowUpIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "../components/button";
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
  AgentSessionTimelineScrollState,
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
  timelineScrollTop,
  onTimelineScroll,
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
        initialScrollTop={timelineScrollTop}
        onTimelineScroll={onTimelineScroll}
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
  initialScrollTop,
  onTimelineScroll,
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

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || typeof initialScrollTop !== "number") return;
    element.scrollTop = Math.max(0, Math.min(initialScrollTop, element.scrollHeight));
    shouldFollowRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }, [initialScrollTop]);

  return (
    <div
      ref={scrollRef}
      className={cn("px-4 pb-6 pt-3 [&_[data-slot=session-turn-content]]:mx-auto [&_[data-slot=session-turn-content]]:w-full [&_[data-slot=session-turn-content]]:max-w-[780px] [&_[data-component=assistant-message]]:flex [&_[data-component=assistant-message]]:flex-col [&_[data-component=assistant-message]]:gap-2.5 [&_[data-component=text-part]]:text-[13px] [&_[data-slot=text-part-body]]:leading-[1.6] [&_[data-component=user-message]]:ml-auto [&_[data-component=user-message]]:max-w-[77%] [&_[data-slot=user-message-body]]:rounded-[18px] [&_[data-slot=user-message-body]]:bg-muted/70 [&_[data-slot=user-message-body]]:px-3 [&_[data-slot=user-message-body]]:py-2 [&_[data-slot=user-message-body]]:ring-1 [&_[data-slot=user-message-body]]:ring-border/35 [&_[data-slot=user-message-text]]:whitespace-pre-wrap [&_[data-slot=user-message-text]]:break-words [&_[data-slot=user-message-text]]:text-[13px] [&_[data-slot=user-message-text]]:leading-5 [&_[data-slot=text-part-meta]]:mt-2 [&_[data-slot=text-part-meta]]:inline-flex [&_[data-slot=text-part-meta]]:w-fit [&_[data-slot=text-part-meta]]:rounded-full [&_[data-slot=text-part-meta]]:bg-muted/40 [&_[data-slot=text-part-meta]]:px-2 [&_[data-slot=text-part-meta]]:py-0.5 [&_[data-slot=text-part-meta]]:text-[10px] [&_[data-slot=text-part-meta]]:leading-4 [&_[data-slot=text-part-meta]]:text-muted-foreground", className)}
      data-component="agent-session-timeline"
      {...props}
      onScroll={(event) => {
        const element = event.currentTarget;
        const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        shouldFollowRef.current = atBottom;
        onTimelineScroll?.({
          scrollTop: element.scrollTop,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          atBottom
        });
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
  footerEnd,
  header,
  placeholder = "Answer in your own words...",
  pending = false,
  disabled = false,
  className = "",
  ...props
}: AgentSessionComposerProps) {
  const isDisabled = disabled || pending || !value.trim();
  const accessibleSubmitLabel = typeof submitLabel === "string" ? submitLabel : "Send";

  return (
    <div className={cn(
      "chat-composer-shell chat-composer-surface mx-auto w-full max-w-[46rem] overflow-hidden border border-[color:color-mix(in_srgb,var(--color-border-heavy,var(--border))_95%,var(--foreground)_5%)] bg-[var(--composer-surface,var(--card))] shadow-[0_4px_18px_-6px_color-mix(in_srgb,var(--foreground)_7%,transparent)] transition-colors duration-200 focus-within:border-[color:color-mix(in_srgb,var(--foreground)_14%,transparent)] dark:border-border dark:shadow-[0_6px_24px_-10px_rgba(0,0,0,0.30)]",
      className,
    )}>
      {header && <div>{header}</div>}
      <div className={cn(
        "relative pl-[var(--app-density-composer-editor-padding-x,0.75rem)] pr-[var(--app-density-composer-editor-padding-x-end,0.875rem)] pb-[var(--app-density-composer-editor-padding-bottom,0.5rem)]",
        header ? "pt-1.5" : "pt-[var(--app-density-composer-editor-padding-top,0.75rem)]",
      )}>
        <textarea
          {...props}
          className="font-system-ui block min-h-[var(--app-density-composer-editor-min-height,2lh)] max-h-[200px] w-full resize-none overflow-y-auto whitespace-pre-wrap break-words border-0 bg-transparent text-[length:var(--app-font-size-chat,12px)] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 focus:outline-none"
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
      </div>
      <div className="flex items-center justify-between gap-2 pl-[var(--app-density-composer-footer-padding,0.375rem)] pr-[var(--app-density-composer-footer-padding-end,0.5rem)] pb-[var(--app-density-composer-footer-padding,0.375rem)]">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">{footerStart}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {footerEnd}
          <Tooltip>
            <TooltipTrigger
              render={(
                <Button
                  aria-label={pending ? "Construct Interact is thinking" : accessibleSubmitLabel}
                  className="size-7 rounded-full sm:size-7 agent-composer-submit-btn"
                  type="button"
                  size="icon-xs"
                  variant="prominent"
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
    </div>
  );
}

type TimelineRowGroup =
  | { kind: "single"; row: AgentSessionTimelineRow }
  | { kind: "activity-group"; rows: AgentSessionTimelineRow[]; entries: AgentRunTraceEntry[] };

function isActivityPartRow(row: AgentSessionTimelineRow): row is Extract<AgentSessionTimelineRow, { type: "assistant-part" }> & { part: { type: "activity"; entry: AgentRunTraceEntry } } {
  return row.type === "assistant-part" && row.part.type === "activity";
}

function isGroupableActivityPartRow(row: AgentSessionTimelineRow): row is Extract<AgentSessionTimelineRow, { type: "assistant-part" }> & { part: { type: "activity"; entry: AgentRunTraceEntry } } {
  return isActivityPartRow(row) && row.part.entry.kind === "tool";
}

function groupConsecutiveActivityRows(rows: AgentSessionTimelineRow[]): TimelineRowGroup[] {
  const groups: TimelineRowGroup[] = [];
  let i = 0;

  while (i < rows.length) {
    const row = rows[i];
    if (isGroupableActivityPartRow(row)) {
      const activityRows: AgentSessionTimelineRow[] = [row];
      const entries: AgentRunTraceEntry[] = [row.part.entry];
      let j = i + 1;
      while (j < rows.length) {
        const nextRow = rows[j];
        if (!isGroupableActivityPartRow(nextRow)) break;
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

import { ArrowUpIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import { Button } from "../components/button";
import { Textarea } from "../components/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/utils";
import { AgentSessionTimelineRowView } from "./AgentSessionPrimitives";
import { buildAgentSessionTimeline } from "./timeline";
import type {
  AgentSessionComposerProps,
  AgentSessionSurfaceProps,
  AgentSessionTimelineProps
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
      className="mb-5 border-l-2 border-border/80 pl-3 pr-1"
      data-component="agent-session-header"
    >
      {eyebrow != null ? <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow}</p> : null}
      {title != null ? <h3 className="mt-1 text-sm font-semibold">{title}</h3> : null}
      {lead != null ? <div className="mt-1.5 text-[13px] leading-5 text-foreground/90">{lead}</div> : null}
    </header>
  ) : null;

  return (
    <section className={cn("flex min-h-0 flex-1 flex-col bg-background text-foreground", className)} {...props}>
      <AgentSessionTimeline
        className="min-h-0 flex-1 overflow-y-auto"
        header={header}
        messages={messages}
        rows={rows}
        emptyState={emptyState}
        showReasoningSummaries={showReasoningSummaries}
        scrollKey={scrollKey}
      />

      {composer ? <div className="shrink-0 bg-background/95 px-2 pb-2 pt-1 backdrop-blur">{composer}</div> : null}
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
  const timelineRows = rows ?? buildAgentSessionTimeline(messages);
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
      className={cn("px-3 pb-5 pt-2 [&_[data-component=assistant-message]]:flex [&_[data-component=assistant-message]]:flex-col [&_[data-component=assistant-message]]:gap-2 [&_[data-component=text-part]]:text-[13px] [&_[data-slot=text-part-body]]:leading-[1.65] [&_[data-component=user-message]]:ml-auto [&_[data-component=user-message]]:max-w-[77%] [&_[data-slot=user-message-body]]:rounded-2xl [&_[data-slot=user-message-body]]:bg-muted/75 [&_[data-slot=user-message-body]]:px-3 [&_[data-slot=user-message-body]]:py-2 [&_[data-slot=user-message-body]]:ring-1 [&_[data-slot=user-message-body]]:ring-border/40 [&_[data-slot=user-message-text]]:whitespace-pre-wrap [&_[data-slot=user-message-text]]:break-words [&_[data-slot=user-message-text]]:text-[13px] [&_[data-slot=user-message-text]]:leading-5 [&_[data-slot=text-part-meta]]:mt-2 [&_[data-slot=text-part-meta]]:inline-flex [&_[data-slot=text-part-meta]]:w-fit [&_[data-slot=text-part-meta]]:rounded-full [&_[data-slot=text-part-meta]]:bg-muted/45 [&_[data-slot=text-part-meta]]:px-2 [&_[data-slot=text-part-meta]]:py-0.5 [&_[data-slot=text-part-meta]]:text-[10px] [&_[data-slot=text-part-meta]]:leading-4 [&_[data-slot=text-part-meta]]:text-muted-foreground", className)}
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
            <div className="flex flex-col gap-5" data-slot="session-turn-message-container">
              {timelineRows.map((row) => (
                <AgentSessionTimelineRowView key={row.id} row={row} showReasoningSummaries={showReasoningSummaries} />
              ))}
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
  placeholder = "Answer in your own words...",
  pending = false,
  disabled = false,
  className = "",
  ...props
}: AgentSessionComposerProps) {
  const isDisabled = disabled || pending || !value.trim();
  const accessibleSubmitLabel = typeof submitLabel === "string" ? submitLabel : "Send";

  return (
    <div className={cn("overflow-hidden rounded-3xl bg-muted/35 shadow-sm ring-1 ring-border/80 transition-[box-shadow,background-color] focus-within:bg-muted/45 focus-within:ring-ring/70", className)}>
      <Textarea
        {...props}
        className="min-h-11 max-h-32 resize-none border-0 bg-transparent px-4 pb-0 pt-3 text-[13px] leading-5 shadow-none focus-visible:border-transparent focus-visible:ring-0"
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
      <div className="flex items-center justify-end px-2 pb-2 pt-0.5">
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

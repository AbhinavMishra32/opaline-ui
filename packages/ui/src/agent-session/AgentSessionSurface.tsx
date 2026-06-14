import { Button } from "../components/button";
import { cn } from "../lib/utils";
import { AgentSessionTimelineRowView } from "./AgentSessionPrimitives";
import { buildAgentSessionTimeline } from "./timeline";
import type {
  AgentSessionComposerProps,
  AgentSessionSurfaceProps,
  AgentSessionTimelineProps
} from "./types";

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
  AgentSessionToolStatus
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
  className = "",
  ...props
}: AgentSessionSurfaceProps) {
  return (
    <section className={cn("flex min-h-0 flex-1 flex-col bg-background text-foreground", className)} {...props}>
      {(eyebrow != null || title != null || lead != null) ? (
        <header className="shrink-0 border-b px-4 py-3">
          {eyebrow != null ? <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p> : null}
          {title != null ? <h3 className="mt-0.5 text-sm font-semibold">{title}</h3> : null}
          {lead != null ? <div className="mt-1 text-xs text-muted-foreground">{lead}</div> : null}
        </header>
      ) : null}

      <AgentSessionTimeline
        className="min-h-0 flex-1 overflow-y-auto"
        messages={messages}
        rows={rows}
        emptyState={emptyState}
        showReasoningSummaries={showReasoningSummaries}
      />

      {composer ? <div className="shrink-0 border-t p-3">{composer}</div> : null}
    </section>
  );
}

export function AgentSessionTimeline({
  messages,
  rows,
  emptyState,
  showReasoningSummaries = false,
  className = "",
  ...props
}: AgentSessionTimelineProps) {
  const timelineRows = rows ?? buildAgentSessionTimeline(messages);

  return (
    <div
      className={cn("px-4 py-3 [&_[data-component=assistant-message]]:space-y-3 [&_[data-component=session-turn-message-container]]:space-y-4 [&_[data-component=text-part]]:text-sm [&_[data-component=user-message]]:ml-auto [&_[data-component=user-message]]:max-w-[85%] [&_[data-slot=user-message-body]]:rounded-lg [&_[data-slot=user-message-body]]:bg-muted [&_[data-slot=user-message-body]]:px-3 [&_[data-slot=user-message-body]]:py-2 [&_[data-slot$=-meta]]:text-[10px] [&_[data-slot$=-meta]]:text-muted-foreground", className)}
      data-component="agent-session-timeline"
      {...props}
    >
      {timelineRows.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{emptyState ?? "No messages yet."}</div>
      ) : (
        <div data-component="session-turn">
          <div data-slot="session-turn-content">
            <div data-slot="session-turn-message-container">
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

  return (
    <div className={cn("rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/30", className)}>
      <textarea
        {...props}
        className="min-h-20 w-full resize-none bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        spellCheck
      />
      <div className="mt-2 flex justify-end">
        <Button type="button" disabled={isDisabled} onClick={onSubmit}>
          {pending ? "Thinking" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

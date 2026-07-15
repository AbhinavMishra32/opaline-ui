import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretRightIcon,
  CheckIcon,
  SpinnerIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { Button } from "../components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/utils";
import { AgentSessionActions } from "./AgentSessionPrimitives";
import type {
  AgentSessionMessage,
  AgentSessionMessagePart,
  AgentSessionTimelineScrollState,
  AgentSessionToolEntry,
  AgentSessionToolStatus,
} from "./types";

export type AsideThreadSurfaceProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  messages: AgentSessionMessage[];
  composer?: ReactNode;
  activePanel?: ReactNode;
  emptyState?: ReactNode;
  showReasoningSummaries?: boolean;
  scrollKey?: string | number;
  timelineScrollTop?: number | null;
  onTimelineScroll?: (state: AgentSessionTimelineScrollState) => void;
};

export type AsideThreadComposerProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onSubmit"> & {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: ReactNode;
  leadingAction?: ReactNode;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  pending?: boolean;
  disabled?: boolean;
};

export function AsideThreadSurface({
  messages,
  composer,
  activePanel,
  emptyState,
  showReasoningSummaries = false,
  scrollKey,
  timelineScrollTop,
  onTimelineScroll,
  className,
  ...props
}: AsideThreadSurfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const [scrollButtonVisible, setScrollButtonVisible] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !activePanel) {
      setPanelHeight(0);
      return;
    }
    const measure = () => setPanelHeight(panel.offsetHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [activePanel]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !shouldFollowRef.current) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages.length, scrollKey]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || typeof timelineScrollTop !== "number") return;
    element.scrollTop = Math.max(0, Math.min(timelineScrollTop, element.scrollHeight));
    shouldFollowRef.current = isAtBottom(element);
  }, [timelineScrollTop]);

  const scrollToBottom = () => {
    const element = scrollRef.current;
    if (!element) return;
    shouldFollowRef.current = true;
    setScrollButtonVisible(false);
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  };

  return (
    <section
      className={cn("aside-thread-ui relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground", className)}
      data-agent-session-ui="aside-thread"
      data-aside-thread-ui="true"
      style={{ "--agent-session-panel-overlay-height": `${panelHeight}px` } as CSSProperties}
      {...props}
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          ref={scrollRef}
          className="min-h-0 min-w-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain [overflow-anchor:none]"
          data-component="aside-message-list"
          onScroll={(event) => {
            const element = event.currentTarget;
            const atBottom = isAtBottom(element);
            shouldFollowRef.current = atBottom;
            setScrollButtonVisible(!atBottom);
            onTimelineScroll?.({
              scrollTop: element.scrollTop,
              scrollHeight: element.scrollHeight,
              clientHeight: element.clientHeight,
              atBottom,
            });
          }}
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full min-h-full w-full min-w-0 items-center justify-center px-4 py-4 lg:px-8" data-agent-session-ui="aside-thread">
              <div className="flex w-full justify-center">{emptyState}</div>
            </div>
          ) : (
            <div className="mx-auto w-full min-w-0 px-5 py-4 lg:px-8" data-component="message-list">
              <div className="relative flex w-full max-w-full min-w-0 flex-col" data-testid="message-list-item-list">
                {messages.map((message) => (
                  <AsideMessageRow
                    key={message.id}
                    message={message}
                    showReasoningSummaries={showReasoningSummaries}
                  />
                ))}
                <div
                  aria-hidden="true"
                  className="scroll-mb-4"
                  style={{ height: `calc(var(--agent-session-panel-overlay-height, 0px) + 24px)` }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          aria-hidden={!scrollButtonVisible}
          className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center"
        >
          <button
            aria-label="Scroll to bottom"
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-full border border-border bg-muted text-foreground shadow-lg backdrop-blur-md transition-all",
              scrollButtonVisible ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-0 opacity-0",
            )}
            onClick={scrollToBottom}
            tabIndex={scrollButtonVisible ? 0 : -1}
            type="button"
          >
            <ArrowDownIcon className="size-4" />
          </button>
        </div>
      </div>

      {activePanel ? (
        <div className="relative z-10 h-0 w-full shrink-0" data-component="aside-agent-session-panel">
          <div ref={panelRef} className="absolute inset-x-0 bottom-0 px-7 opacity-100 lg:px-14">
            <div className="border-border/70 bg-card/80 overflow-hidden rounded-2xl rounded-b-none border border-b-0 backdrop-blur-md">
              <div className="relative p-1 pb-1.5 text-xs">{activePanel}</div>
            </div>
          </div>
        </div>
      ) : null}

      {composer ? <div className="relative z-20 w-full shrink-0">{composer}</div> : null}
    </section>
  );
}

export function AsideThreadComposer({
  value,
  onValueChange,
  onSubmit,
  submitLabel = "Send",
  leadingAction,
  footerStart,
  footerEnd,
  pending = false,
  disabled = false,
  placeholder = "Ask AI a task, @ for context",
  className,
  ...props
}: AsideThreadComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = disabled || pending || !value.trim();
  const accessibleSubmitLabel = typeof submitLabel === "string" ? submitLabel : "Send";

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <form
      className={cn("mx-auto w-full px-3 pb-1", className)}
      data-agent-session-ui="aside-thread"
      data-chat-input-form="true"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isDisabled) onSubmit();
      }}
    >
      <div className="aside-thread-composer-surface relative mx-auto flex w-full flex-col gap-0.5 overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border transition-shadow focus-within:shadow-lg">
        <div className="relative">
          <textarea
            {...props}
            ref={textareaRef}
            className="block max-h-40 min-h-10 w-full resize-none overflow-y-auto border-0 bg-transparent px-11 py-2.5 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground/60 focus:outline-none"
            data-testid="chat-input"
            disabled={disabled}
            placeholder={placeholder}
            spellCheck
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
          />
          {leadingAction ? <div className="absolute bottom-1.5 left-1.5">{leadingAction}</div> : null}
          <div className="absolute right-1.5 bottom-1.5">
            <Tooltip>
              <TooltipTrigger
                render={(
                  <Button
                    aria-label={pending ? "Construct agent is thinking" : accessibleSubmitLabel}
                    className="size-7 rounded-full"
                    disabled={isDisabled}
                    size="icon-xs"
                    type="submit"
                    variant="prominent"
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
      <div className="flex min-w-0 items-center justify-between gap-2 py-1">
        <div className="flex min-w-0 flex-1 items-center gap-1">{footerStart}</div>
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1">{footerEnd}</div>
      </div>
    </form>
  );
}

function AsideMessageRow({
  message,
  showReasoningSummaries,
}: {
  message: AgentSessionMessage;
  showReasoningSummaries: boolean;
}) {
  return (
    <div className="w-full max-w-full min-w-0 pb-2" data-testid="message-list-item">
      <div className="group/message w-full" data-role={message.role} data-testid={`message-${message.role}`}>
        <div
          className={cn(
            "w-full min-w-0",
            message.role === "user" ? "ml-auto max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]" : "max-w-full",
          )}
        >
          <div
            className={cn(
              "group flex w-full max-w-[95%] flex-col gap-2",
              message.role === "user" ? "is-user ml-auto items-end justify-end" : "is-assistant",
            )}
          >
            {message.role === "user" ? (
              <>
                <div className="ml-auto w-fit max-w-full min-w-0 overflow-hidden rounded-xl bg-secondary px-3 py-1.5 text-sm text-foreground">
                  <div className="wrap-break-word whitespace-pre-wrap text-sm" data-testid="message-content">{message.content}</div>
                </div>
                {message.meta ? (
                  <div className="flex min-h-6 items-center justify-end opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100">
                    {message.meta}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex w-full max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm text-foreground">
                <AsideAssistantParts parts={message.parts ?? []} fallback={message.content} showReasoningSummaries={showReasoningSummaries} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AsideAssistantParts({
  parts,
  fallback,
  showReasoningSummaries,
}: {
  parts: AgentSessionMessagePart[];
  fallback?: ReactNode;
  showReasoningSummaries: boolean;
}) {
  if (parts.length === 0) {
    return fallback ? <div className="w-full max-w-full min-w-0 overflow-hidden bg-transparent pb-2" data-testid="message-content">{fallback}</div> : null;
  }

  return parts.map((part, index) => {
    const isProcess = isProcessPart(part);
    const hasNextProcess = isProcessPart(parts[index + 1]);
    return (
      <AsideAssistantPart
        key={part.id}
        part={part}
        showReasoningSummaries={showReasoningSummaries}
        showProcessLine={isProcess && hasNextProcess}
      />
    );
  });
}

function AsideAssistantPart({
  part,
  showReasoningSummaries,
  showProcessLine,
}: {
  part: AgentSessionMessagePart;
  showReasoningSummaries: boolean;
  showProcessLine: boolean;
}) {
  if (part.type === "text") {
    return (
      <div id={part.id} className="w-full max-w-full min-w-0 overflow-hidden bg-transparent pb-2" data-testid="message-content">
        {part.content}
        {part.meta ? <div className="mt-1 text-[13px] text-muted-foreground opacity-0 transition-opacity group-hover/message:opacity-100">{part.meta}</div> : null}
      </div>
    );
  }

  if (part.type === "actions") {
    return (
      <div id={part.id} className="aside-thread-domain-item w-full min-w-0 pb-2">
        <AgentSessionActions actions={part.actions}>{part.content}</AgentSessionActions>
      </div>
    );
  }

  if (part.type === "activity") {
    return (
      <AsideProcessItem
        id={part.id}
        active={part.entry.status === "running" || part.entry.status === "pending"}
        defaultOpen={part.defaultOpen}
        showLine={showProcessLine}
        status={part.entry.status}
        title={part.entry.title}
      >
        {part.entry.subtitle ? <p className="text-muted-foreground text-xs">{part.entry.subtitle}</p> : null}
        {part.entry.input ? <AsideProcessDetail label="Input" value={part.entry.input} /> : null}
        {part.entry.output ? <AsideProcessDetail label="Output" value={part.entry.output} /> : null}
      </AsideProcessItem>
    );
  }

  if (part.type === "reasoning") {
    return (
      <AsideProcessItem
        id={part.id}
        active={part.active}
        defaultOpen={part.defaultOpen}
        showLine={showProcessLine}
        status={part.active ? "running" : "completed"}
        title={part.label}
      >
        {showReasoningSummaries ? part.content : null}
      </AsideProcessItem>
    );
  }

  if (part.type === "context") {
    return (
      <AsideProcessItem
        id={part.id}
        active={part.active}
        defaultOpen={part.defaultOpen}
        showLine={showProcessLine}
        status={part.active ? "running" : "completed"}
        title={part.active ? (part.activeLabel ?? "Gathering context") : (part.doneLabel ?? "Gathered context")}
      >
        {part.summary ? <div className="text-muted-foreground pb-2 text-xs">{part.summary}</div> : null}
        <div className="flex flex-col gap-1">{part.entries.map((entry) => <AsideToolEntry key={entry.id} entry={entry} />)}</div>
      </AsideProcessItem>
    );
  }

  return (
    <AsideProcessItem
      id={part.id}
      active={part.tool.status === "running" || part.tool.status === "pending"}
      defaultOpen={part.tool.defaultOpen}
      showLine={showProcessLine}
      status={part.tool.status}
      title={part.tool.title}
    >
      {part.tool.subtitle ? <p className="text-muted-foreground pb-2 text-xs">{part.tool.subtitle}</p> : null}
      {part.tool.content}
    </AsideProcessItem>
  );
}

function AsideProcessItem({
  id,
  title,
  status,
  active,
  defaultOpen = false,
  showLine,
  children,
}: {
  id: string;
  title: ReactNode;
  status?: AgentSessionToolStatus;
  active?: boolean;
  defaultOpen?: boolean;
  showLine: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || Boolean(active));
  const expandable = children != null;

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <div id={id} className="group/process-item -mx-1 flex items-start gap-1.5 pb-2 text-sm" data-component="aside-process-item">
      <div className="relative flex min-h-6 w-6 shrink-0 items-start justify-center self-stretch">
        {showLine ? <div className="absolute top-6 left-1/2 h-[calc(100%-16px)] min-h-2 w-px -translate-x-1/2 bg-border" data-line="true" /> : null}
        <div className="relative z-10 flex size-6 items-center justify-center text-muted-foreground">
          <AsideStatusIcon status={status} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <button
          aria-expanded={expandable ? open : undefined}
          className="flex min-h-6 w-full items-center justify-start gap-1 overflow-hidden border-0 bg-transparent p-0 text-left text-muted-foreground transition-colors hover:text-foreground disabled:opacity-100"
          disabled={!expandable}
          onClick={() => expandable && setOpen((current) => !current)}
          type="button"
        >
          <span className={cn("block max-w-full min-w-0 truncate font-normal", active && "opaline-agent-thinking-shimmer")}>{title}</span>
          {expandable ? <CaretRightIcon className={cn("size-4 shrink-0 opacity-0 transition-all group-hover/process-item:opacity-100", open && "rotate-90 opacity-100")} /> : null}
        </button>
        {expandable ? (
          <div className={cn("grid transition-[grid-template-rows,opacity] duration-200", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div className="overflow-hidden">
              <div className="p-1 pb-2 pt-3 text-sm">{children}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AsideStatusIcon({ status }: { status?: AgentSessionToolStatus }) {
  if (status === "running" || status === "pending") return <SpinnerIcon className="size-4 animate-spin" />;
  if (status === "error") return <WarningCircleIcon className="size-4 text-destructive" />;
  if (status === "completed") return <CheckIcon className="size-4" />;
  return <span className="size-1.5 rounded-full bg-muted-foreground/35" />;
}

function AsideProcessDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/70 bg-muted/35 mt-1 overflow-hidden rounded-lg border">
      <div className="border-border/60 border-b px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words p-2 font-mono text-[11px] leading-4 text-foreground/85">{value}</pre>
    </div>
  );
}

function AsideToolEntry({ entry }: { entry: AgentSessionToolEntry }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-muted/40">
      <AsideStatusIcon status={entry.status} />
      <span className="min-w-0 flex-1 truncate">{entry.title}</span>
      {entry.subtitle ? <span className="max-w-1/2 truncate text-muted-foreground">{entry.subtitle}</span> : null}
    </div>
  );
}

function isProcessPart(part: AgentSessionMessagePart | undefined): boolean {
  if (!part) return false;
  return part.type === "activity" || part.type === "reasoning" || part.type === "context" || part.type === "tool";
}

function isAtBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= 4;
}

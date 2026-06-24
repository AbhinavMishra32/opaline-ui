import { CaretRightIcon, CheckIcon, PencilSimpleLine, TerminalWindowIcon, WarningCircleIcon, GlobeIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { cn } from "../lib/utils";
import type { AgentRunTraceEntry } from "./types";

export type AgentRunTraceProps = {
  state?: "thinking" | "thought";
  entries: AgentRunTraceEntry[];
  durationMs?: number;
  defaultOpen?: boolean;
  className?: string;
  onOpenFile?: (path: string) => void;
};

export function AgentRunTrace({
  state = "thinking",
  entries,
  durationMs,
  defaultOpen = false,
  className,
  onOpenFile
}: AgentRunTraceProps) {
  const [open, setOpen] = useState(defaultOpen);
  const disclosureTransition = useFileTreeDisclosureTransition();
  const displayEntries = useMemo(() => compactTraceEntries(entries), [entries]);
  const active = state === "thinking";
  const expandable = displayEntries.length > 1;
  const hasActiveEntry = displayEntries.some((entry) => entry.status === "pending" || entry.status === "running");
  const estimatedMs = durationMs ?? entries.length * 2000;
  const label = active ? "Working" : traceGroupLabel(entries, estimatedMs);

  return (
    <div
      className={cn("group/trace flex w-full flex-col gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-200", className)}
      data-component="agent-run-trace"
      data-active={active || undefined}
    >
      <button
        type="button"
        className={cn(
          "flex w-fit max-w-full items-center gap-1 rounded-md p-0 text-left text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30",
          expandable ? "cursor-pointer" : "cursor-default"
        )}
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <span className={cn("font-medium", active && !hasActiveEntry && "opaline-agent-thinking-shimmer")}>{label}</span>
        {expandable ? <TraceChevron open={open} transition={disclosureTransition} className="opacity-0 transition-opacity group-hover/trace:opacity-100" /> : null}
      </button>

      <AnimatePresence initial={false}>
        {expandable && open ? (
          <motion.div
            key="agent-run-trace-list"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            <div className="flex flex-col gap-2 pl-2 pr-1" data-slot="agent-run-trace-list">
              {displayEntries.map((entry) => <AgentRunTraceRow entry={entry} key={entry.id} onOpenFile={onOpenFile} />)}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AgentRunTraceRow({
  entry,
  defaultOpen = false,
  onOpenFile
}: {
  entry: AgentRunTraceEntry;
  defaultOpen?: boolean;
  onOpenFile?: (path: string) => void;
}) {
  const fileChanges = useMemo(() => readFileChanges(entry), [entry]);
  const commandRun = useMemo(() => readCommandRun(entry), [entry]);
  const webSearch = useMemo(() => readWebSearch(entry), [entry]);
  const webFetch = useMemo(() => readWebFetch(entry), [entry]);
  const [open, setOpen] = useState(defaultOpen || fileChanges.length > 0 || commandRun?.failed === true);
  const disclosureTransition = useFileTreeDisclosureTransition();
  const reasoningText = entry.kind === "thought" ? entry.output : undefined;
  const expandable = Boolean(reasoningText || entry.input || entry.output);
  const active = entry.status === "pending" || entry.status === "running";
  const label = traceRowLabel(entry);
  const title = computeTraceRowTitle(entry, label);

  if (fileChanges.length > 0) {
    return (
      <AgentRunFileChangeRow
        changes={fileChanges}
        entry={entry}
        onOpenFile={onOpenFile}
        open={open}
        setOpen={setOpen}
        transition={disclosureTransition}
      />
    );
  }

  if (commandRun) {
    return (
      <AgentRunCommandRow
        entry={entry}
        open={open}
        run={commandRun}
        setOpen={setOpen}
        transition={disclosureTransition}
      />
    );
  }

  if (webSearch) {
    return (
      <AgentRunWebSearchRow
        entry={entry}
        webSearch={webSearch}
        open={open}
        setOpen={setOpen}
        transition={disclosureTransition}
      />
    );
  }

  if (webFetch) {
    return (
      <AgentRunWebFetchRow
        entry={entry}
        webFetch={webFetch}
        open={open}
        setOpen={setOpen}
        transition={disclosureTransition}
      />
    );
  }


  return (
    <div className="flex min-w-0 flex-col gap-1 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
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
          <span
            className={cn(
              entry.kind === "thought" ? "font-normal text-muted-foreground" : "font-medium text-foreground/90",
              active && entry.kind === "thought" && "opaline-agent-thinking-shimmer",
              active && entry.kind !== "thought" && "opaline-agent-thinking-shimmer"
            )}
            data-slot="agent-run-trace-row-label"
          >
            {label}
          </span>
          {title ? <span className="ml-1.5 text-muted-foreground" data-slot="agent-run-trace-row-title">{title}</span> : null}
          {entry.subtitle ? <span className="ml-1.5 text-muted-foreground" data-slot="agent-run-trace-row-subtitle">{entry.subtitle}</span> : null}
        </span>
        {expandable ? <TraceChevron open={open} transition={disclosureTransition} className="mt-0.5 opacity-0 transition-opacity group-hover/row:opacity-100" /> : null}
      </button>

      <AnimatePresence initial={false}>
        {expandable && open ? (
          <motion.div
            key={`${entry.id}:details`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={disclosureTransition}
          >
            <div className={cn(
              "ml-5",
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function readWebSearch(entry: AgentRunTraceEntry) {
  const title = (entry.title ?? "").toLowerCase();
  if (entry.kind !== "tool" || (!title.includes("searched web") && !title.includes("searched web x times"))) return null;
  const input = parseTraceJson(entry.input);
  const inputRecord = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const query = typeof inputRecord.query === "string" ? inputRecord.query : entry.subtitle || "";
  return { query };
}

function readWebFetch(entry: AgentRunTraceEntry) {
  const title = (entry.title ?? "").toLowerCase();
  if (entry.kind !== "tool" || (!title.includes("fetched web") && !title.includes("fetched page"))) return null;
  const input = parseTraceJson(entry.input);
  const inputRecord = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const urls = Array.isArray(inputRecord.urls)
    ? inputRecord.urls.filter((u): u is string => typeof u === "string")
    : typeof inputRecord.urls === "string"
      ? [inputRecord.urls]
      : [];

  const output = parseTraceJson(entry.output);
  
  let rawResults: any[] = [];
  if (output && typeof output === "object") {
    const record = output as Record<string, any>;
    if (Array.isArray(record.results)) {
      rawResults = record.results;
    } else if (Array.isArray(output)) {
      rawResults = output;
    }
  } else if (Array.isArray(output)) {
    rawResults = output;
  }

  const results = rawResults.map((r: any) => ({
    url: typeof r?.url === "string" ? r.url : "",
    title: typeof r?.title === "string" ? r.title : typeof r?.url === "string" ? getDomain(r.url) : "Fetched page",
    content: typeof r?.content === "string" ? r.content : "",
    favicon: typeof r?.favicon === "string" ? r.favicon : ""
  }));

  return { urls, results };
}

function getDomain(urlStr: string): string {
  if (!urlStr) return "";
  let cleanUrl = urlStr.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = "https://" + cleanUrl;
  }
  try {
    const url = new URL(cleanUrl);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return cleanUrl;
  }
}

function SearchResultItem({ res }: { res: { url: string; title: string; content: string; favicon?: string } }) {
  const [imgFailed, setImgFailed] = useState(false);
  const resDomain = getDomain(res.url);
  const resFavicon = res.favicon || (resDomain ? `https://www.google.com/s2/favicons?sz=64&domain=${resDomain}` : undefined);

  return (
    <div className="flex flex-col gap-1 border-b border-border/10 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="relative flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-muted/40 shadow-xs border border-border/20">
          {resFavicon && !imgFailed ? (
            <img
              src={resFavicon}
              alt=""
              className="size-full object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <GlobeIcon size={11} className="text-muted-foreground" />
          )}
        </span>
        <a
          href={res.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-[11px] font-semibold text-primary hover:underline"
        >
          {res.title || res.url}
        </a>
      </div>
      {res.content && (
        <p className="text-[10px] text-foreground/80 leading-normal pl-5 font-normal select-text">
          {res.content}
        </p>
      )}
    </div>
  );
}

function AgentRunWebFetchRow({
  entry,
  webFetch,
  open,
  setOpen,
  transition
}: {
  entry: AgentRunTraceEntry;
  webFetch: ReturnType<typeof readWebFetch>;
  open: boolean;
  setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  transition: any;
}) {
  const active = entry.status === "pending" || entry.status === "running";
  const failed = entry.status === "error";

  const firstResult = webFetch?.results?.[0];
  const url = firstResult?.url || webFetch?.urls?.[0] || "";
  const title = firstResult?.title || (url ? getDomain(url) : "Web Page");
  const favicon = firstResult?.favicon;
  const domain = url ? getDomain(url) : "";

  const faviconSrc = favicon || (domain ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : undefined);
  const [imgFailed, setImgFailed] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-1 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind="tool">
      <button
        type="button"
        className="inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 rounded-md p-0 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="flex items-center gap-1 shrink-0">
            {active ? (
              <span className="grid size-3.5 place-items-center">
                <span className="size-2 animate-ping rounded-full bg-primary" />
              </span>
            ) : failed ? (
              <WarningCircleIcon size={14} className="text-destructive shrink-0" />
            ) : (
              <span className="relative flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-muted/40 shadow-xs border border-border/20">
                {faviconSrc && !imgFailed ? (
                  <img
                    src={faviconSrc}
                    alt=""
                    className="size-full object-contain"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <GlobeIcon size={11} className="text-muted-foreground" />
                )}
              </span>
            )}
          </span>
          <span className="truncate font-medium text-foreground/90 max-w-[280px] md:max-w-[400px]">
            {title}
          </span>
        </span>
        <CaretRightIcon
          size={12}
          className={cn(
            "shrink-0 text-muted-foreground/60 transition-transform group-hover/row:text-foreground",
            open ? "rotate-90" : ""
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key={`${entry.id}:details`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="ml-5 flex flex-col gap-2.5 rounded-md bg-muted/25 p-2.5 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-border/30">
              <div className="flex items-center justify-between border-b border-border/10 pb-1.5 mb-0.5">
                <span className="font-semibold text-foreground/80">Page Contents</span>
                <button
                  type="button"
                  className="text-[10px] text-primary/80 hover:text-primary hover:underline cursor-pointer select-none font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRaw(!showRaw);
                  }}
                >
                  {showRaw ? "Standard view" : "Advanced view"}
                </button>
              </div>

              {showRaw ? (
                <div className="flex flex-col gap-2 select-text">
                  {entry.output ? <TraceDetail label="Output" value={entry.output} /> : null}
                  {entry.input ? <TraceDetail label="Input" value={entry.input} /> : null}
                </div>
              ) : (
                <>
                  {url && (
                    <div className="flex items-center gap-1 border-b border-border/20 pb-1.5">
                      <span className="font-semibold text-foreground/85">URL:</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:underline text-primary/90 font-medium"
                      >
                        {url}
                      </a>
                    </div>
                  )}
                  {webFetch && webFetch.results && webFetch.results.length > 0 ? (
                    <div className="flex flex-col gap-2.5 mt-1 select-text">
                      {webFetch.results.map((res, i) => (
                        <div key={i} className="flex flex-col gap-1.5">
                          {res.title && (
                            <h4 className="text-xs font-semibold text-foreground/90 leading-tight">
                              {res.title}
                            </h4>
                          )}
                          {res.content && (
                            <div className="relative flex flex-col gap-1 rounded-md border border-border/40 bg-background/50 p-2 font-mono text-[10px] leading-relaxed text-foreground/95 select-text max-h-48 overflow-y-auto">
                              <pre className="whitespace-pre-wrap">{res.content}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    entry.output ? <TraceDetail label="Result" value={entry.output} /> : null
                  )}
                  {entry.input ? <TraceDetail label="Input" value={entry.input} /> : null}
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AgentRunWebSearchRow({
  entry,
  webSearch,
  open,
  setOpen,
  transition
}: {
  entry: AgentRunTraceEntry;
  webSearch: ReturnType<typeof readWebSearch>;
  open: boolean;
  setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  transition: any;
}) {
  const active = entry.status === "pending" || entry.status === "running";
  const failed = entry.status === "error";
  const rawQuery = webSearch?.query || "";
  const query = rawQuery.trim().replace(/^[\*_`"']+|[\*_`"']+$/g, "").trim();
  const [showRaw, setShowRaw] = useState(false);

  const output = parseTraceJson(entry.output);
  
  let rawResults: any[] = [];
  if (Array.isArray(output)) {
    rawResults = output;
  } else if (output && typeof output === "object") {
    const record = output as Record<string, any>;
    if (Array.isArray(record.results)) {
      rawResults = record.results;
    }
  }

  const searchResults = rawResults.map((r: any) => ({
    url: typeof r?.url === "string" ? r.url : "",
    title: typeof r?.title === "string" ? r.title : typeof r?.url === "string" ? getDomain(r.url) : "Untitled result",
    content: typeof r?.snippet === "string" ? r.snippet : typeof r?.content === "string" ? r.content : "",
    favicon: typeof r?.favicon === "string" ? r.favicon : ""
  }));

  return (
    <div className="flex min-w-0 flex-col gap-1 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind="tool">
      <button
        type="button"
        className="inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 rounded-md p-0 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-1.5 min-w-0" style={{ fontWeight: 400, fontStyle: "normal" }}>
          <span className="flex items-center gap-1 shrink-0">
            {active ? (
              <span className="grid size-3.5 place-items-center">
                <span className="size-2 animate-ping rounded-full bg-primary" />
              </span>
            ) : failed ? (
              <WarningCircleIcon size={14} className="text-destructive shrink-0" />
            ) : (
              <MagnifyingGlassIcon size={13} className="text-muted-foreground shrink-0" />
            )}
          </span>
          <span className="font-normal text-muted-foreground" style={{ fontWeight: 400, fontStyle: "normal" }}>Searched web for</span>
          {query && (
            <span className="truncate font-normal text-muted-foreground max-w-[200px] md:max-w-[320px]" style={{ fontWeight: 400, fontStyle: "normal" }}>
              "{query}"
            </span>
          )}
        </span>
        <CaretRightIcon
          size={12}
          className={cn(
            "shrink-0 text-muted-foreground/60 transition-transform group-hover/row:text-foreground",
            open ? "rotate-90" : ""
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key={`${entry.id}:details`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="ml-5 flex flex-col gap-2.5 rounded-md bg-muted/25 p-2.5 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-border/30">
              <div className="flex items-center justify-between border-b border-border/10 pb-1.5 mb-0.5">
                <span className="font-semibold text-foreground/80">Search Results</span>
                <button
                  type="button"
                  className="text-[10px] text-primary/80 hover:text-primary hover:underline cursor-pointer select-none font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRaw(!showRaw);
                  }}
                >
                  {showRaw ? "Standard view" : "Advanced view"}
                </button>
              </div>

              {showRaw ? (
                <div className="flex flex-col gap-2 select-text">
                  {entry.output ? <TraceDetail label="Output" value={entry.output} /> : null}
                  {entry.input ? <TraceDetail label="Input" value={entry.input} /> : null}
                </div>
              ) : (
                <>
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-3 mt-1 select-text">
                      {searchResults.map((res, i) => (
                        <SearchResultItem key={i} res={res} />
                      ))}
                    </div>
                  ) : (
                    entry.output ? <TraceDetail label="Result" value={entry.output} /> : null
                  )}
                  {entry.input ? <TraceDetail label="Input" value={entry.input} /> : null}
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type CommandRunSummary = {
  command: string;
  cwd?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | string | null;
  failed: boolean;
  blocked: boolean;
  truncated: boolean;
};

function AgentRunCommandRow({
  entry,
  open,
  run,
  setOpen,
  transition
}: {
  entry: AgentRunTraceEntry;
  open: boolean;
  run: CommandRunSummary;
  setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  transition: ReturnType<typeof useFileTreeDisclosureTransition>;
}) {
  const active = entry.status === "pending" || entry.status === "running";
  const label = run.blocked ? "Blocked command" : run.failed ? "Command failed" : "Ran command";
  const statusLabel = run.blocked ? "Blocked" : run.failed ? "Failed" : "Success";
  const output = [
    run.command ? `$ ${run.command}` : "",
    run.cwd ? `# ${run.cwd}` : "",
    run.stdout?.trim() ? run.stdout.trimEnd() : "",
    run.stderr?.trim() ? run.stderr.trimEnd() : "",
    run.truncated ? "... [truncated]" : ""
  ].filter(Boolean).join("\n\n");

  return (
    <div className="flex min-w-0 flex-col gap-1.5 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
      <button
        type="button"
        className="inline-flex w-fit max-w-full min-w-0 items-center gap-2 rounded-md p-0 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <TerminalWindowIcon className="size-3.5 shrink-0" />
        <span className={cn("font-semibold", active && "opaline-agent-thinking-shimmer")}>{label}</span>
        <span className="min-w-0 truncate text-muted-foreground">{run.command}</span>
        <TraceChevron open={open} transition={transition} className="opacity-70" />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key={`${entry.id}:command-run`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="ml-6 max-w-full overflow-hidden rounded-[10px] bg-muted/45 p-3 text-[12px] leading-relaxed text-muted-foreground ring-1 ring-border/30">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-medium text-foreground/80">Shell</span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  run.failed || run.blocked ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {run.failed || run.blocked ? <WarningCircleIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
                  {statusLabel}{run.exitCode != null ? ` (${run.exitCode})` : ""}
                </span>
              </div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] leading-5 text-foreground/80">{output || "No output."}</pre>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TraceChevron({
  className,
  open,
  transition
}: {
  className?: string;
  open: boolean;
  transition: ReturnType<typeof useFileTreeDisclosureTransition>;
}) {
  return (
    <motion.span
      animate={{ rotate: open ? 90 : 0 }}
      className={cn("inline-flex size-3 shrink-0 items-center justify-center", className)}
      initial={false}
      transition={transition}
    >
      <CaretRightIcon className="size-3" />
    </motion.span>
  );
}

type FileChangeSummary = {
  path: string;
  action: "edited" | "wrote" | "changed";
  additions: number;
  deletions: number;
};

function AgentRunFileChangeRow({
  changes,
  entry,
  onOpenFile,
  open,
  setOpen,
  transition
}: {
  changes: FileChangeSummary[];
  entry: AgentRunTraceEntry;
  onOpenFile?: (path: string) => void;
  open: boolean;
  setOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  transition: ReturnType<typeof useFileTreeDisclosureTransition>;
}) {
  const active = entry.status === "pending" || entry.status === "running";
  const expandable = changes.length > 0;
  const fileWord = changes.length === 1 ? "file" : "files";
  const label = `${entry.status === "error" ? "Failed editing" : "Edited"} ${changes.length === 1 ? "a" : changes.length} ${fileWord}`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5 animate-in fade-in-0 slide-in-from-left-1 duration-200 group/row" data-slot="agent-run-trace-entry" data-kind={entry.kind}>
      <button
        type="button"
        className="inline-flex w-fit max-w-full min-w-0 items-center gap-2 rounded-md p-0 text-left text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        disabled={!expandable}
        aria-expanded={expandable ? open : undefined}
        onClick={() => expandable && setOpen((value) => !value)}
      >
        <PencilSimpleLine className="size-3.5 shrink-0" />
        <span className={cn("font-semibold", active && "opaline-agent-thinking-shimmer")}>{label}</span>
        {expandable ? <TraceChevron open={open} transition={transition} className="opacity-70" /> : null}
      </button>

      <AnimatePresence initial={false}>
        {expandable && open ? (
          <motion.div
            key={`${entry.id}:file-changes`}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
          >
            <div className="ml-6 flex flex-col gap-1.5 pb-1">
              {changes.map((change) => (
                <div key={`${change.action}:${change.path}`} className="flex min-w-0 items-center gap-2 text-sm leading-6">
                  <span className="shrink-0 text-muted-foreground">{change.action === "wrote" ? "Wrote" : "Edited"}</span>
                  {onOpenFile ? (
                    <button
                      type="button"
                      className="min-w-0 truncate rounded-[5px] px-1 text-left font-medium text-blue-600 transition-colors hover:bg-muted hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 dark:text-blue-400 dark:hover:text-blue-300"
                      title={change.path}
                      onClick={() => onOpenFile(change.path)}
                    >
                      {basename(change.path)}
                    </button>
                  ) : (
                    <span className="min-w-0 truncate font-medium text-blue-600 dark:text-blue-400">{basename(change.path)}</span>
                  )}
                  <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[13px] tabular-nums">
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">+<RollingTraceNumber value={change.additions} /></span>
                    <span className="inline-flex items-center text-red-600 dark:text-red-400">-<RollingTraceNumber value={change.deletions} /></span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function RollingTraceNumber({ value }: { value: number }) {
  const places = useMemo(() => {
    const digits = Math.max(0, Math.floor(Math.abs(value))).toString();
    return digits.split("").map((_, index) => 10 ** (digits.length - index - 1));
  }, [value]);

  return (
    <span className="relative inline-flex overflow-hidden align-[-0.12em]" style={{ height: 16, lineHeight: 1 }}>
      {places.map((place) => (
        <RollingTraceDigit key={place} height={16} place={place} value={Math.max(0, Math.floor(Math.abs(value)))} />
      ))}
    </span>
  );
}

function RollingTraceDigit({
  height,
  place,
  value
}: {
  height: number;
  place: number;
  value: number;
}) {
  const rounded = Math.floor(value / place);
  const spring = useSpring(rounded, { stiffness: 220, damping: 28, mass: 0.7 });

  useEffect(() => {
    spring.set(rounded);
  }, [rounded, spring]);

  return (
    <span className="relative inline-flex w-[1ch] overflow-hidden" style={{ height, fontVariantNumeric: "tabular-nums" }}>
      {Array.from({ length: 10 }, (_, number) => (
        <RollingTraceDigitValue key={number} height={height} motionValue={spring} number={number} />
      ))}
    </span>
  );
}

function RollingTraceDigitValue({
  height,
  motionValue,
  number
}: {
  height: number;
  motionValue: MotionValue<number>;
  number: number;
}) {
  const y = useTransform(motionValue, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    return (offset > 5 ? offset - 10 : offset) * height;
  });
  const style: CSSProperties = {
    alignItems: "center",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    position: "absolute"
  };
  return <motion.span style={{ ...style, y }}>{number}</motion.span>;
}

function readFileChanges(entry: AgentRunTraceEntry): FileChangeSummary[] {
  if (entry.kind !== "tool" || entry.icon !== "file") return [];
  const parsed = parseTraceJson(entry.output);
  const rawChanges = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { files?: unknown } | null)?.files)
      ? (parsed as { files: unknown[] }).files
      : parsed != null
        ? [parsed]
        : [];
  const changes = rawChanges
    .map((item) => readFileChangeSummary(item, entry))
    .filter((item): item is FileChangeSummary => item != null);
  if (changes.length > 0) return changes;

  const inferredPath = inferPathFromTitle(entry.title);
  if (!inferredPath) return [];
  return [{
    path: inferredPath,
    action: entry.title.toLowerCase().startsWith("wrote") ? "wrote" : "edited",
    additions: 0,
    deletions: 0
  }];
}

function readCommandRun(entry: AgentRunTraceEntry): CommandRunSummary | null {
  if (entry.kind !== "tool" || entry.icon !== "terminal") return null;
  const input = parseTraceJson(entry.input);
  const output = parseTraceJson(entry.output);
  const inputRecord = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const outputRecord = typeof output === "object" && output !== null ? output as Record<string, unknown> : {};
  const command = readString(outputRecord.command) || readString(inputRecord.command) || entry.title;
  const stdout = readString(outputRecord.stdout);
  const stderr = readString(outputRecord.stderr)
    || readString(outputRecord.reason)
    || (entry.status === "error" && !output ? entry.output : undefined);
  const rawStatus = (readString(outputRecord.status) ?? "").toLowerCase();
  const blocked = rawStatus === "blocked";
  const failed = entry.status === "error" || rawStatus === "failed" || blocked;

  return {
    command,
    cwd: readString(outputRecord.cwd) || readString(inputRecord.cwd),
    stdout,
    stderr,
    exitCode: readString(outputRecord.exitCode) || readNumberOrNull(outputRecord.exitCode),
    failed,
    blocked,
    truncated: outputRecord.truncated === true
  };
}

function readFileChangeSummary(value: unknown, entry: AgentRunTraceEntry): FileChangeSummary | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as {
    path?: unknown;
    lineStats?: {
      additions?: unknown;
      deletions?: unknown;
    };
    additions?: unknown;
    deletions?: unknown;
    action?: unknown;
  };
  const path = typeof record.path === "string" && record.path.trim()
    ? record.path
    : inferPathFromTitle(entry.title);
  if (!path) return null;
  return {
    path,
    action: record.action === "wrote" || entry.title.toLowerCase().startsWith("wrote") ? "wrote" : "edited",
    additions: readNumber(record.lineStats?.additions ?? record.additions),
    deletions: readNumber(record.lineStats?.deletions ?? record.deletions)
  };
}

function parseTraceJson(value: string | undefined): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function extractPathFromTraceJson(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = parseTraceJson(value);
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const record = parsed as Record<string, unknown>;
  const path = readString(record.path) || readString(record.file) || readString(record.filePath);
  if (path) return path;
  if (typeof record.input === "object" && record.input !== null) {
    const inputRecord = record.input as Record<string, unknown>;
    return readString(inputRecord.path) || readString(inputRecord.file) || readString(inputRecord.filePath) || undefined;
  }
  return undefined;
}

function inferPathFromTitle(title: string): string | null {
  const match = title.match(/^(?:edited|wrote|write|changed|created)\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function readNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function basename(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

function useFileTreeDisclosureTransition() {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.28, bounce: 0.02 };
}

function traceRowLabel(entry: AgentRunTraceEntry): string {
  if (entry.kind === "thought") return "Thinking";
  switch (entry.icon) {
    case "terminal":
      return entry.status === "error" ? "Command failed" : "Ran command";
    case "search":
      return "Searched code";
    case "file":
      if (/\bfiles\b/i.test(entry.title)) return "Changed files";
      if (entry.title.toLowerCase().startsWith("write") || entry.title.toLowerCase().startsWith("wrote")) return "Wrote file";
      return entry.title.toLowerCase().startsWith("edit") ? "Edited file" : "Changed file";
    case "memory":
      return "Updated memory";
    case "read":
      return "Read";
    default:
      return "Used tool";
  }
}

function shouldShowTraceRowTitle(entry: AgentRunTraceEntry, label: string): boolean {
  if (entry.kind === "thought" || label === entry.title) return false;
  if (entry.icon === "terminal" || entry.icon === "search") return false;
  return !/^tool\b/i.test(entry.title);
}

function computeTraceRowTitle(entry: AgentRunTraceEntry, label: string): string | undefined {
  if (entry.icon === "read") {
    const match = entry.title.match(/^(?:Read|Viewed)\s+(.+)$/i);
    if (match) {
      const fp = match[1];
      if (fp.includes(".") || fp.includes("/") || fp.includes("\\")) {
        return basename(fp);
      }
    }
    const inputPath = extractPathFromTraceJson(entry.input);
    if (inputPath) return basename(inputPath);
    const outputPath = extractPathFromTraceJson(entry.output);
    if (outputPath) return basename(outputPath);
    return undefined;
  }
  return shouldShowTraceRowTitle(entry, label) ? entry.title : undefined;
}

function traceGroupLabel(entries: AgentRunTraceEntry[], durationMs: number): string {
  const summary = summarizeTraceGroup(entries);
  if (summary) return summary;
  return `Activity ${formatDuration(durationMs)}`;
}

function summarizeTraceGroup(entries: AgentRunTraceEntry[]): string | null {
  const tools = entries.filter((entry) => entry.kind === "tool");
  if (!tools.length) return null;
  const readCount = tools.filter((entry) => entry.icon === "read").length;
  const searchCount = tools.filter((entry) => entry.icon === "search" && entry.title !== "Searched web").length;
  const webSearchCount = tools.filter((entry) => entry.title === "Searched web").length;
  const webFetchCount = tools.filter((entry) => entry.title === "Fetched web page").length;
  const terminalCount = tools.filter((entry) => entry.icon === "terminal").length;
  const memoryCount = tools.filter((entry) => entry.icon === "memory").length;
  const editedCount = tools.filter((entry) => entry.icon === "file").length;
  const knownCount = readCount + searchCount + webSearchCount + webFetchCount + terminalCount + memoryCount + editedCount;
  const otherCount = Math.max(0, tools.length - knownCount);
  const segments: string[] = [];

  if (readCount) segments.push(`read ${countLabel(readCount, "file")}`);
  if (searchCount) segments.push(searchCount === 1 ? "searched code" : `searched code ${searchCount} times`);
  if (webSearchCount) segments.push(webSearchCount === 1 ? "searched web" : `searched web ${webSearchCount} times`);
  if (webFetchCount) segments.push(webFetchCount === 1 ? "fetched web page" : `fetched ${countLabel(webFetchCount, "web page")}`);
  if (editedCount) segments.push(`changed ${countLabel(editedCount, "file")}`);
  if (terminalCount) segments.push(`ran ${countLabel(terminalCount, "command")}`);
  if (memoryCount) segments.push(`updated ${countLabel(memoryCount, "memory item")}`);
  if (otherCount) segments.push(`used ${countLabel(otherCount, "tool")}`);

  const sentence = joinNatural(segments);
  return sentence ? sentence.charAt(0).toUpperCase() + sentence.slice(1) : null;
}

function compactTraceEntries(entries: AgentRunTraceEntry[]): AgentRunTraceEntry[] {
  const compacted: AgentRunTraceEntry[] = [];
  let index = 0;

  while (index < entries.length) {
    const entry = entries[index];
    const bucket = traceCompactionBucket(entry);

    if (!bucket) {
      compacted.push(entry);
      index += 1;
      continue;
    }

    const group: AgentRunTraceEntry[] = [entry];
    let nextIndex = index + 1;

    while (nextIndex < entries.length && traceCompactionBucket(entries[nextIndex]) === bucket) {
      group.push(entries[nextIndex]);
      nextIndex += 1;
    }

    compacted.push(group.length > 1 ? compactTraceGroup(bucket, group) : entry);
    index = nextIndex;
  }

  return compacted;
}

function traceCompactionBucket(entry: AgentRunTraceEntry): string | null {
  if (entry.kind !== "tool" || entry.status === "running" || entry.status === "pending") return null;
  if (entry.icon === "file") {
    if (/^(wrote|write|created|changed|edited)\b/i.test(entry.title)) return "file-write";
    return "file-touch";
  }
  if (entry.icon === "read") return "file-read";
  if (entry.icon === "search") {
    if ((entry.title ?? "").toLowerCase().includes("searched web")) return "web-search";
    return "search";
  }
  return null;
}

function compactTraceGroup(bucket: string, entries: AgentRunTraceEntry[]): AgentRunTraceEntry {
  const titles = entries.map((entry) => entry.title).filter(Boolean);
  const fileChanges = entries.flatMap(readFileChanges);
  const files = titles
    .map((title) => title.replace(/^(wrote|write|created|changed|edited|read|searched)\s+/i, "").trim())
    .filter(Boolean);
  const status = entries.some((entry) => entry.status === "error") ? "error" : "completed";
  const title =
    bucket === "file-read" ? `Read ${countLabel(entries.length, "file")}`
    : bucket === "search" ? (entries.length === 1 ? "Searched code" : `Searched code ${entries.length} times`)
    : bucket === "web-search" ? (entries.length === 1 ? "Searched web" : `Searched web ${entries.length} times`)
    : bucket === "file-write" ? `Wrote ${countLabel(entries.length, "file")}`
    : `Changed ${countLabel(entries.length, "file")}`;

  return {
    ...entries[0],
    id: `${entries[0].id}:compact:${entries.length}`,
    title,
    subtitle: summarizeTraceTargets(files),
    status,
    input: undefined,
    output: fileChanges.length
      ? JSON.stringify({ files: fileChanges }, null, 2)
      : files.length ? files.map((file) => `- ${file}`).join("\n") : titles.map((item) => `- ${item}`).join("\n")
  };
}

function summarizeTraceTargets(targets: string[]): string | undefined {
  if (!targets.length) return undefined;
  const preview = targets.slice(0, 3).join(", ");
  return targets.length > 3 ? `${preview}, +${targets.length - 3} more` : preview;
}

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function joinNatural(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function TraceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[10px] font-semibold">{label}</span>
      <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-foreground/80">{value}</pre>
    </div>
  );
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) return `${durationMs} ms`;
  return `${Math.round(durationMs / 1_000)}s`;
}

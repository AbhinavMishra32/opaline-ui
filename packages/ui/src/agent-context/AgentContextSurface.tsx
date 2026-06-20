import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { ArrowUpRight, Expand, Lightbulb, X } from "lucide-react";
import type { HTMLAttributes, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

export type AgentContextAnchor = { x: number; y: number };
export type AgentContextMode = "anchored" | "floating";
export type AgentContextStage = "prompt" | "working" | "result" | "error";

export type AgentContextSurfaceProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> & {
  open: boolean;
  anchor?: AgentContextAnchor | null;
  mode?: AgentContextMode;
  stage?: AgentContextStage;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  onDismiss?: () => void;
  onModeChange?: (mode: AgentContextMode) => void;
  floatingLabel?: string;
  collisionPadding?: number;
  dismissOnInteractOutside?: boolean;
};

const spring = { type: "spring" as const, stiffness: 430, damping: 38, mass: 0.82 };

export function AgentContextSurface({
  open,
  anchor,
  mode = "anchored",
  stage = "prompt",
  title,
  eyebrow,
  children,
  onDismiss,
  onModeChange,
  floatingLabel = "Open as floating card",
  collisionPadding = 12,
  dismissOnInteractOutside = mode === "anchored",
  className = "",
  ...props
}: AgentContextSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();
  const [measuredSize, setMeasuredSize] = useState({ width: 320, height: 52 });

  useLayoutEffect(() => {
    if (!open || !surfaceRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setMeasuredSize({ width: entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width, height: entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height });
    });
    observer.observe(surfaceRef.current);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss?.();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!dismissOnInteractOutside) return;
      if (!surfaceRef.current?.contains(event.target as Node)) onDismiss?.();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [dismissOnInteractOutside, open, onDismiss]);

  const position = useMemo(() => {
    if (mode === "floating") {
      return {
        left: Math.max(collisionPadding, window.innerWidth - Math.min(520, window.innerWidth - collisionPadding * 2) - 24),
        top: Math.max(collisionPadding, Math.min(92, window.innerHeight - measuredSize.height - collisionPadding))
      };
    }
    const desiredLeft = anchor?.x ?? collisionPadding;
    const desiredTop = (anchor?.y ?? collisionPadding) + 8;
    const left = Math.min(Math.max(collisionPadding, desiredLeft), Math.max(collisionPadding, window.innerWidth - measuredSize.width - collisionPadding));
    const below = window.innerHeight - desiredTop;
    const top = below >= measuredSize.height + collisionPadding
      ? desiredTop
      : Math.max(collisionPadding, (anchor?.y ?? desiredTop) - measuredSize.height - 8);
    return { left, top };
  }, [anchor?.x, anchor?.y, collisionPadding, measuredSize.height, measuredSize.width, mode]);
  const dragConstraints = useMemo(() => ({
    left: collisionPadding - position.left,
    right: Math.max(0, window.innerWidth - position.left - measuredSize.width - collisionPadding),
    top: collisionPadding - position.top,
    bottom: Math.max(0, window.innerHeight - position.top - measuredSize.height - collisionPadding)
  }), [collisionPadding, measuredSize.height, measuredSize.width, position.left, position.top]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={surfaceRef}
          layout
          layoutId="opaline-agent-context-surface"
          className={cn("opaline-overlay-shadow fixed z-50 flex w-[min(520px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground", className)}
          data-mode={mode}
          data-stage={stage}
          style={{ left: position.left, top: position.top }}
          initial={{ opacity: 0, scale: 0.965, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.975, y: -3 }}
          transition={spring}
          drag={mode === "floating"}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={dragConstraints}
          dragMomentum={false}
          dragElastic={0.04}
          {...props}
        >
          {(mode === "floating" || title || eyebrow) ? (
            <header
              className="flex min-h-11 items-center gap-2 border-b px-3 py-2"
              onPointerDown={(event: ReactPointerEvent<HTMLElement>) => {
                if (mode === "floating" && !(event.target as HTMLElement).closest("button, a")) dragControls.start(event);
              }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-muted text-muted-foreground"><Lightbulb size={14} /></span>
              <div className="min-w-0 flex-1">
                {eyebrow ? <small className="block truncate text-xs font-medium text-muted-foreground">{eyebrow}</small> : null}
                {title ? <strong className="block truncate text-sm font-medium">{title}</strong> : null}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 [&_button]:flex [&_button]:size-7 [&_button]:items-center [&_button]:justify-center [&_button]:rounded-md [&_button]:text-muted-foreground [&_button:hover]:bg-muted [&_button:hover]:text-foreground">
                {mode === "anchored" && stage !== "prompt" && onModeChange ? (
                  <button type="button" onClick={() => onModeChange("floating")} aria-label={floatingLabel} title={floatingLabel}>
                    <Expand size={14} />
                  </button>
                ) : null}
                <button type="button" onClick={onDismiss} aria-label="Close"><X size={14} /></button>
              </div>
            </header>
          ) : null}
          <motion.div className="min-h-0 p-3" layout transition={spring}>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export type AgentContextActionProps = HTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
};

export function AgentContextAction({ icon, label, description, className = "", ...props }: AgentContextActionProps) {
  return (
    <button className={cn("flex w-full items-start gap-3 rounded-[7px] p-2 text-left hover:bg-muted", className)} type="button" {...props}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border bg-background text-muted-foreground">{icon ?? <Lightbulb size={14} />}</span>
      <span className="min-w-0"><strong className="block text-sm font-medium">{label}</strong>{description ? <small className="mt-0.5 block text-xs text-muted-foreground">{description}</small> : null}</span>
    </button>
  );
}

export type AgentContextSource = { id: string; title: string; url: string; domain?: string };

export function AgentContextSources({ sources, label = "Sources" }: { sources: AgentContextSource[]; label?: ReactNode }) {
  if (sources.length === 0) return null;
  return (
    <section className="mt-3 border-t pt-3">
      <small className="text-xs font-medium text-muted-foreground">{label}</small>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <a className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-2 py-1 text-xs hover:bg-muted" href={source.url} key={source.id} target="_blank" rel="noreferrer">
            <span className="text-muted-foreground">{index + 1}</span>
            <b className="font-medium">{source.domain ?? source.title}</b>
            <ArrowUpRight size={11} />
          </a>
        ))}
      </div>
    </section>
  );
}

import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, Pin, PinOff, X } from "lucide-react";
import type { CSSProperties, HTMLAttributes, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";

export type AdaptiveSidecarMode = "overlay" | "shift" | "gutter";

export type AdaptiveSidecarLayoutProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  sidecar: ReactNode;
  open: boolean;
  pinned?: boolean;
  sidecarWidth?: number;
  gap?: number;
  overlayThreshold?: number;
  gutterThreshold?: number;
  keepMounted?: boolean;
};

export type AdaptiveSidecarSurfaceProps = Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
> & {
  title: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  pinned?: boolean;
  draggable?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onPinnedChange?: (pinned: boolean) => void;
  onClose?: () => void;
  closeLabel?: string;
  collapseLabel?: string;
  expandLabel?: string;
  pinLabel?: string;
  unpinLabel?: string;
};

const SIDE_WIDTH = 300;
const SIDE_GAP = 16;
const OVERLAY_THRESHOLD = 1096;
const GUTTER_THRESHOLD = 1536;
const MIN_SIDE_WIDTH = 220;
const MAX_SIDE_WIDTH = 720;
const panelSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 0.8
};
const collapseSpring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 30,
  mass: 0.7
};
const SidecarBoundsContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function getAdaptiveSidecarMode(
  width: number,
  overlayThreshold = OVERLAY_THRESHOLD,
  gutterThreshold = GUTTER_THRESHOLD,
): AdaptiveSidecarMode {
  if (width < overlayThreshold) return "overlay";
  if (width < gutterThreshold) return "shift";
  return "gutter";
}

export function AdaptiveSidecarLayout({
  children,
  sidecar,
  open,
  pinned = false,
  sidecarWidth = SIDE_WIDTH,
  gap = SIDE_GAP,
  overlayThreshold = OVERLAY_THRESHOLD,
  gutterThreshold = GUTTER_THRESHOLD,
  keepMounted = true,
  className = "",
  style,
  ...props
}: AdaptiveSidecarLayoutProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  const reduceMotion = useReducedMotion();

  const [currentWidth, setCurrentWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("opaline-sidecar-width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return clampSidecarWidth(parsed);
      }
    }
    return clampSidecarWidth(sidecarWidth);
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setCurrentWidth((prev) => {
      if (typeof window === "undefined") return clampSidecarWidth(sidecarWidth);
      const saved = localStorage.getItem("opaline-sidecar-width");
      if (!saved) {
        return clampSidecarWidth(sidecarWidth);
      }
      return prev;
    });
  }, [sidecarWidth]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => setWidth(root.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const mode = useMemo(
    () => getAdaptiveSidecarMode(width, overlayThreshold, gutterThreshold),
    [gutterThreshold, overlayThreshold, width],
  );
  const inline = open && pinned && mode !== "overlay";
  const shift = inline && mode === "shift" ? -(currentWidth + gap) / 2 : 0;
  const transition = isResizing || reduceMotion ? { duration: 0 } : panelSpring;
  const railOffset = currentWidth + gap;

  const widthRef = useRef(currentWidth);
  widthRef.current = currentWidth;

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = widthRef.current;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = clampSidecarWidth(startWidth - deltaX);
      setCurrentWidth(newWidth);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      setIsResizing(false);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);

      const deltaX = upEvent.clientX - startX;
      const finalWidth = clampSidecarWidth(startWidth - deltaX);
      localStorage.setItem("opaline-sidecar-width", String(finalWidth));
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative flex h-full min-h-0 w-full overflow-hidden", className)}
      data-mode={mode}
      data-open={open ? "true" : "false"}
      data-pinned={pinned ? "true" : "false"}
      style={{
        ...style,
        "--opaline-sidecar-width": `${currentWidth}px`,
        "--opaline-sidecar-gap": `${gap}px`,
      } as CSSProperties}
      {...props}
    >
      <motion.div
        className="min-w-0 flex-1"
        animate={{ x: shift }}
        transition={transition}
      >
        {children}
      </motion.div>
      <AnimatePresence initial={false}>
        {keepMounted || open ? (
          <motion.aside
            ref={railRef}
            className="absolute inset-y-0 right-0 z-30 flex w-[var(--opaline-sidecar-width)] items-stretch p-[var(--opaline-sidecar-gap)] pb-[calc(var(--opaline-sidecar-gap)+0.5rem)] data-[inline=true]:relative data-[inline=true]:z-auto data-[visible=false]:pointer-events-none"
            data-inline={inline ? "true" : "false"}
            data-visible={open ? "true" : "false"}
            aria-hidden={!open}
            initial={false}
            animate={{
              opacity: open ? 1 : 0,
              x: open ? 0 : railOffset,
              scale: open ? 1 : 0.98
            }}
            exit={{
              opacity: 0,
              x: railOffset,
              scale: 0.98
            }}
            transition={transition}
          >
            <div
              className="group absolute bottom-3 left-0 top-3 z-40 flex w-5 -translate-x-1/2 cursor-col-resize items-center justify-center rounded-full"
              data-visible={open ? "true" : "false"}
              onPointerDown={open ? handlePointerDown : undefined}
              aria-hidden={!open}
            >
              <div
                className={cn(
                  "h-10 w-px rounded-full bg-border opacity-0 transition-[height,opacity,background-color,width] duration-150 group-hover:h-16 group-hover:w-0.5 group-hover:bg-muted-foreground/45 group-hover:opacity-100",
                  isResizing && "h-full w-0.5 bg-primary opacity-100"
                )}
              />
            </div>
            <SidecarBoundsContext.Provider value={railRef}>
              {sidecar}
            </SidecarBoundsContext.Provider>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AdaptiveSidecarSurface({
  title,
  eyebrow,
  children,
  actions,
  footer,
  collapsed = false,
  pinned = false,
  draggable = false,
  onCollapsedChange,
  onPinnedChange,
  onClose,
  closeLabel = "Close",
  collapseLabel = "Collapse",
  expandLabel = "Expand",
  pinLabel = "Pin",
  unpinLabel = "Unpin",
  className = "",
  ...props
}: AdaptiveSidecarSurfaceProps) {
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const dragBounds = useContext(SidecarBoundsContext);
  const transition = reduceMotion ? { duration: 0 } : panelSpring;
  const bodyTransition = reduceMotion ? { duration: 0 } : collapseSpring;

  return (
    <motion.article
      layout
      className={cn(
        "opaline-overlay-shadow flex min-h-11 max-h-full w-full flex-col overflow-hidden rounded-[18px] border border-border/80 bg-popover/92 text-popover-foreground backdrop-blur-xl backdrop-saturate-150",
        className
      )}
      data-collapsed={collapsed ? "true" : "false"}
      data-pinned={pinned ? "true" : "false"}
      data-draggable={draggable ? "true" : "false"}
      transition={transition}
      drag={draggable ? "y" : false}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.035}
      dragConstraints={dragBounds ?? undefined}
      {...props}
    >
      <header
        className={cn(
          "flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/35 px-3 py-2",
          draggable && "cursor-grab active:cursor-grabbing"
        )}
        onPointerDown={(event: ReactPointerEvent<HTMLElement>) => {
          if (draggable && !(event.target as HTMLElement).closest("button, a")) dragControls.start(event);
        }}
      >
        <div className="min-w-0 flex-1">
          {eyebrow ? <span className="block truncate text-[11px] font-medium uppercase tracking-normal text-muted-foreground">{eyebrow}</span> : null}
          <strong className="block truncate text-sm font-semibold">{title}</strong>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 [&_button]:flex [&_button]:size-7 [&_button]:items-center [&_button]:justify-center [&_button]:rounded-[7px] [&_button]:text-muted-foreground [&_button]:transition-colors [&_button:hover]:bg-muted [&_button:hover]:text-foreground">
          {actions}
          {onCollapsedChange ? (
            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              aria-label={collapsed ? expandLabel : collapseLabel}
              aria-expanded={!collapsed}
              title={collapsed ? expandLabel : collapseLabel}
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          ) : null}
          {onPinnedChange ? (
            <button
              type="button"
              onClick={() => onPinnedChange(!pinned)}
              aria-label={pinned ? unpinLabel : pinLabel}
              title={pinned ? unpinLabel : pinLabel}
            >
              {pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          ) : null}
          {onClose ? (
            <button type="button" onClick={onClose} aria-label={closeLabel} title={closeLabel}>
              <X size={14} />
            </button>
          ) : null}
        </div>
      </header>
      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="opaline-sidecar-body"
            className="min-h-0 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={bodyTransition}
          >
            <div className="flex max-h-[calc(100vh-7rem)] min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
              {footer ? <footer className="shrink-0 border-t border-border/70 bg-background/30 p-3">{footer}</footer> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function clampSidecarWidth(width: number): number {
  return Math.max(MIN_SIDE_WIDTH, Math.min(MAX_SIDE_WIDTH, width));
}

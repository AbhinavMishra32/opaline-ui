import type { CSSProperties, ReactNode } from "react";
import { cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

type HoverPreviewProps = {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  contentClassName?: string;
  openDelay?: number;
  side?: "left" | "right";
};

export function HoverPreview({
  children,
  content,
  className = "",
  contentClassName = "",
  openDelay = 220,
  side = "right"
}: HoverPreviewProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const positionPreview = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, Math.max(240, window.innerWidth - 32));
    const previewHeight = previewRef.current?.offsetHeight ?? 180;
    const rightLeft = rect.right + 10;
    const leftLeft = rect.left - width - 10;
    const preferredLeft = side === "right"
      ? (rightLeft + width <= window.innerWidth - 12 ? rightLeft : leftLeft)
      : (leftLeft >= 12 ? leftLeft : rightLeft);
    const left = Math.max(16, Math.min(preferredLeft, window.innerWidth - width - 16));
    const top = Math.max(16, Math.min(rect.top, window.innerHeight - previewHeight - 16));
    setStyle({ left, top, width });
  };

  const scheduleOpen = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      positionPreview();
      setOpen(true);
    }, openDelay);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => positionPreview();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, side]);

  useLayoutEffect(() => {
    if (open) positionPreview();
  }, [open, content, side]);

  useEffect(() => () => clearTimer(), []);

  const trigger = isValidElement(children)
    ? cloneElement(children, { "data-hover-preview-trigger": "true" } as Record<string, string>)
    : children;

  return (
    <div
      ref={triggerRef}
      className={cn("contents", className)}
      onMouseEnter={scheduleOpen}
      onMouseLeave={() => {
        clearTimer();
        setOpen(false);
      }}
      onFocus={scheduleOpen}
      onBlur={() => {
        clearTimer();
        setOpen(false);
      }}
    >
      {trigger}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div ref={previewRef} className={cn("opaline-overlay-shadow fixed z-50 max-h-[min(420px,calc(100vh-32px))] overflow-auto rounded-lg border bg-popover p-3 text-popover-foreground", contentClassName)} style={style} role="tooltip">
              {content}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export type { HoverPreviewProps };

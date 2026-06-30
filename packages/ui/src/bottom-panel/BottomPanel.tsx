import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../lib/utils";

// Re-export SlotPanel types with Bottom-panel aliases for backwards compat
export type { SlotTab as BottomPanelTab, SlotPanelHandle as BottomPanelHandle, SlotLauncherItem } from "../slot-panel/SlotPanel";
import { SlotPanel } from "../slot-panel/SlotPanel";
import type { SlotTab, SlotPanelHandle, SlotLauncherItem } from "../slot-panel/SlotPanel";

export { SlotPanel };

const DEFAULT_BOTTOM_PANEL_HEIGHT = 240;

/**
 * Clamps the bottom panel height between min/max limits based on current viewport height.
 */
export function clampBottomPanelHeight(height: number, mainContentHeight: number) {
  return Number.isFinite(height) ? Math.max(140, Math.min(height, mainContentHeight)) : DEFAULT_BOTTOM_PANEL_HEIGHT;
}

export interface BottomPanelProps {
  /** Initial height of the bottom panel in pixels. Defaults to 280. */
  height?: number;
  /** Height of the main container viewport, used to clamp panel resizing to maximum 50% height. */
  mainContentHeight?: number;
  /** Callback fired when a drag-resize action commits a new height. */
  onHeightChange?: (height: number) => void;
  /** Initial tabs to populate the panel with. */
  tabs?: SlotTab[];
  /** Controlled active tab id. */
  activeTabId?: string | null;
  /** Initial active tab id for uncontrolled panels. */
  defaultActiveTabId?: string | null;
  /** Keep inactive tab contents mounted. */
  keepMounted?: boolean;
  /** Optional persistent outlet shared by the active tab strip. */
  outlet?: ReactNode;
  /** Sync tabs on prop updates */
  syncTabs?: boolean;
  /** Treat the incoming tabs prop as the complete open-tab list. */
  controlledTabs?: boolean;
  /** Launcher items shown in the `+` dropdown and empty-state grid. */
  launcherItems?: SlotLauncherItem[];
  /** Callback fired when the far-right panel close cross button is clicked. */
  onClose?: () => void;
  onActiveTabChange?: (id: string | null, tab: SlotTab | null) => void;
  onTabClose?: (id: string, nextTabs?: SlotTab[]) => void;
  onTabOpen?: (tab: SlotTab) => void;
  onTabsChange?: (tabs: SlotTab[]) => void;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

/**
 * Resizable bottom panel — a thin wrapper around `SlotPanel` that adds
 * drag-resize and height clamping. Drop `SlotPanel` directly into other
 * slots (right panel, main area) where resize isn't needed.
 */
export const BottomPanel = React.forwardRef<SlotPanelHandle, BottomPanelProps>(
  function BottomPanel(
    {
      height = DEFAULT_BOTTOM_PANEL_HEIGHT,
      mainContentHeight = typeof window === "undefined" ? 720 : window.innerHeight,
      onHeightChange,
      tabs,
      activeTabId,
      defaultActiveTabId,
      keepMounted,
      outlet,
      controlledTabs = false,
      syncTabs = false,
      launcherItems,
      onClose,
      onActiveTabChange,
      onTabClose,
      onTabOpen,
      onTabsChange,
      expanded: expandedProp,
      onExpandChange,
    },
    ref,
  ) {
    const [panelHeight, setPanelHeight] = useState(() => clampBottomPanelHeight(height, mainContentHeight));
    const [localExpanded, setLocalExpanded] = useState(false);
    const isFullscreen = expandedProp !== undefined ? expandedProp : localExpanded;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const lastWindowedHeightRef = useRef(panelHeight);

    useEffect(() => {
      setPanelHeight((h) => clampBottomPanelHeight(h, mainContentHeight));
    }, [mainContentHeight]);

    useEffect(() => {
      const el = document.querySelector(".opaline-app-shell") || document.documentElement;
      if (el) {
        (el as HTMLElement).style.setProperty("--app-shell-bottom-panel-height", `${panelHeight}px`);
        (el as HTMLElement).style.setProperty("--opaline-v2-bottom-panel-height", `${panelHeight}px`);
      }
    }, [panelHeight]);

    function commitHeight(next: number) {
      const clamped = clampBottomPanelHeight(next, mainContentHeight);
      lastWindowedHeightRef.current = clamped;
      if (onExpandChange) {
        onExpandChange(false);
      } else {
        setLocalExpanded(false);
      }
      setPanelHeight(clamped);
      onHeightChange?.(clamped);
    }

    function toggleFullscreen() {
      const nextExpanded = !isFullscreen;
      if (onExpandChange) {
        onExpandChange(nextExpanded);
      } else {
        setLocalExpanded(nextExpanded);
        if (nextExpanded) {
          lastWindowedHeightRef.current = panelHeight;
          const fullHeight = clampBottomPanelHeight(mainContentHeight, mainContentHeight);
          setPanelHeight(fullHeight);
          onHeightChange?.(fullHeight);
        } else {
          const restored = clampBottomPanelHeight(lastWindowedHeightRef.current, mainContentHeight);
          setPanelHeight(restored);
          onHeightChange?.(restored);
        }
      }
    }

    const startResize = useCallback(
      (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        const startY = event.clientY;
        const startHeight = panelHeight;
        const shell = document.querySelector(".opaline-app-shell") as HTMLElement | null;
        let nextCommittedHeight = panelHeight;
        let pendingHeight = panelHeight;
        let frame = 0;
        document.documentElement.dataset.opalineBottomPanelResizing = "true";

        function applyHeight() {
          frame = 0;
          rootRef.current?.style.setProperty("--app-shell-bottom-panel-height", `${pendingHeight}px`);
          rootRef.current?.style.setProperty("--opaline-v2-bottom-panel-height", `${pendingHeight}px`);
          shell?.style.setProperty("--app-shell-bottom-panel-height", `${pendingHeight}px`);
          shell?.style.setProperty("--opaline-v2-bottom-panel-height", `${pendingHeight}px`);
        }

        function scheduleHeight(height: number) {
          pendingHeight = height;
          if (frame) return;
          frame = window.requestAnimationFrame(applyHeight);
        }

        function move(pointerEvent: PointerEvent) {
          nextCommittedHeight = clampBottomPanelHeight(startHeight + (startY - pointerEvent.clientY), mainContentHeight);
          scheduleHeight(nextCommittedHeight);
        }

        function stop() {
          if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
          pendingHeight = nextCommittedHeight;
          applyHeight();
          delete document.documentElement.dataset.opalineBottomPanelResizing;
          commitHeight(nextCommittedHeight);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", stop);
        }

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop, { once: true });
      },
      [mainContentHeight, onHeightChange, panelHeight]
    );

    return (
      <div
        ref={rootRef}
        className="relative flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        data-app-shell-focus-area="bottom-panel"
        data-fullscreen={isFullscreen ? "true" : "false"}
        style={{
          "--app-shell-bottom-panel-height": `${panelHeight}px`,
          "--opaline-v2-bottom-panel-height": `${panelHeight}px`
        } as CSSProperties}
      >
        <div
          className="absolute inset-x-0 top-0 z-50 h-3 cursor-row-resize touch-none after:absolute after:left-1/2 after:top-1 after:h-1 after:w-10 after:-translate-x-1/2 after:rounded-full after:bg-border/0 after:transition-[width,background-color] after:duration-200 hover:after:w-16 hover:after:bg-border/65"
          aria-label="Resize bottom panel"
          role="separator"
          onPointerDown={startResize}
        />
        <button
          type="button"
          className="absolute right-9 top-1.5 z-20 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={isFullscreen ? "Restore bottom panel height" : "Maximize bottom panel"}
          title={isFullscreen ? "Restore bottom panel height" : "Maximize bottom panel"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        <SlotPanel
          ref={ref}
          activeTabId={activeTabId}
          defaultActiveTabId={defaultActiveTabId}
          tabs={tabs}
          keepMounted={keepMounted}
          outlet={outlet}
          controlledTabs={controlledTabs}
          syncTabs={syncTabs}
          launcherItems={launcherItems}
          onClose={onClose}
          onActiveTabChange={onActiveTabChange}
          onTabClose={onTabClose}
          onTabOpen={onTabOpen}
          onTabsChange={onTabsChange}
          ariaLabel="Bottom panel tabs"
        />
      </div>
    );
  },
);

export interface TerminalSurfaceProps {
  /** Optional class name appended to the container. */
  className?: string;
  /** Any children to render inside (for backwards compat). */
  children?: ReactNode;
  /** Working directory label. */
  cwd?: string;
}

/**
 * Terminal surface — renders children inside a terminal-styled container.
 * For a real xterm.js terminal, use the construct TerminalPanel component instead.
 */
export function TerminalSurface({ children, className, cwd }: TerminalSurfaceProps) {
  return (
    <div
      className={cn(className, "h-full min-h-0 w-full overflow-hidden bg-background font-mono text-xs text-foreground")}
      data-opaline-terminal="true"
      aria-label={cwd}
    >
      {children}
    </div>
  );
}

import * as React from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HouseIcon,
} from "@phosphor-icons/react";

import { Button } from "../components/button";
import { ScrollArea } from "../components/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/tooltip";
import { ShellHistoryProvider } from "../history/ShellHistory";
import type { ShellHistoryController } from "../history/ShellHistory";
import { cn } from "../lib/utils";

export type OpalineV2SidebarItem = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export type OpalineV2SidebarSection = {
  id: string;
  label?: React.ReactNode;
  items: OpalineV2SidebarItem[];
};

export type OpalineV2SidebarProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  sections?: OpalineV2SidebarSection[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  renderItem?: (item: OpalineV2SidebarItem) => React.ReactNode;
  reserveWindowControls?: boolean;
  className?: string;
};

export type OpalineV2ShellTabItem = {
  active?: boolean;
  dirty?: boolean;
  id: string;
  title: React.ReactNode;
};

export type OpalineV2ShellProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  sidebar?: React.ReactNode;
  sidebarOpen?: boolean;
  defaultSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  defaultSidebarWidth?: number;
  sidebarMinWidth?: number;
  sidebarMaxWidth?: number;
  sidebarChrome?: React.ReactNode | ((state: OpalineV2ShellState) => React.ReactNode);
  showSidebarChrome?: boolean;
  collapsedSidebarTrigger?: React.ReactNode | ((state: OpalineV2ShellState) => React.ReactNode);
  inspector?: React.ReactNode;
  rightPanel?: React.ReactNode;
  inspectorOpen?: boolean;
  defaultInspectorOpen?: boolean;
  defaultRightPanelOpen?: boolean;
  onInspectorOpenChange?: (open: boolean) => void;
  inspectorExpanded?: boolean;
  defaultInspectorExpanded?: boolean;
  onInspectorExpandedChange?: (expanded: boolean) => void;
  defaultInspectorWidth?: number;
  defaultRightPanelWidth?: number;
  inspectorMinWidth?: number;
  rightPanelMinWidth?: number;
  inspectorMaxWidth?: number;
  rightPanelMaxWidth?: number;
  actions?: React.ReactNode | ((state: OpalineV2ShellState) => React.ReactNode);
  headerActions?: React.ReactNode | ((state: OpalineV2ShellState) => React.ReactNode);
  header?: React.ReactNode | ((state: OpalineV2ShellState) => React.ReactNode);
  headerTabs?: OpalineV2ShellTabItem[];
  renderHeaderTab?: (tab: OpalineV2ShellTabItem, state: OpalineV2ShellState) => React.ReactNode;
  renderHeaderTabActions?: (tab: OpalineV2ShellTabItem, state: OpalineV2ShellState) => React.ReactNode;
  main: React.ReactNode;
  composer?: React.ReactNode;
  bottomPanel?: React.ReactNode | ((state: OpalineV2ShellState) => React.ReactNode);
  bottomPanelOpen?: boolean;
  defaultBottomPanelOpen?: boolean;
  bottomPanelExpanded?: boolean;
  defaultBottomPanelExpanded?: boolean;
  sidebarWidth?: number;
  inspectorWidth?: number;
  onBottomPanelOpenChange?: (open: boolean) => void;
  onBottomPanelExpandedChange?: (expanded: boolean) => void;
  onSidebarWidthChange?: (width: number) => void;
  onInspectorWidthChange?: (width: number) => void;
  history?: ShellHistoryController<any>;
  canNavigateBack?: boolean;
  canNavigateForward?: boolean;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateHome?: () => void;
  className?: string;
};

export type OpalineV2ShellState = {
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  canNavigateHome: boolean;
  history?: ShellHistoryController<any>;
  inspectorOpen: boolean;
  inspectorExpanded: boolean;
  sidebarOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelExpanded: boolean;
  isBottomPanelOpen: boolean;
  isRightPanelOpen: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setInspectorExpanded: (expanded: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
  setBottomPanelExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  toggleBottomPanelExpanded: () => void;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateHome: () => void;
};

export type OpalineV2ShellButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export type AppShellProps = OpalineV2ShellProps;
export type AppShellState = OpalineV2ShellState;
export type AppShellTabItem = OpalineV2ShellTabItem;

export function AppShell(props: OpalineV2ShellProps) {
  return <OpalineV2Shell {...props} />;
}

export function OpalineV2Shell({
  actions,
  headerActions,
  bottomPanel,
  bottomPanelOpen: controlledBottomPanelOpen,
  bottomPanelExpanded: controlledBottomPanelExpanded,
  defaultBottomPanelExpanded,
  onBottomPanelOpenChange,
  onBottomPanelExpandedChange,
  canNavigateBack,
  canNavigateForward,
  className,
  collapsedSidebarTrigger,
  composer,
  defaultBottomPanelOpen,
  defaultInspectorOpen = true,
  defaultInspectorWidth = 320,
  defaultRightPanelOpen,
  defaultRightPanelWidth,
  defaultSidebarOpen = true,
  defaultSidebarWidth = 300,
  header,
  headerTabs = [],
  history,
  inspector,
  inspectorMaxWidth = 560,
  inspectorMinWidth = 260,
  rightPanel,
  rightPanelMaxWidth,
  rightPanelMinWidth,
  inspectorOpen: controlledInspectorOpen,
  inspectorExpanded: controlledInspectorExpanded,
  inspectorWidth: controlledInspectorWidth,
  defaultInspectorExpanded,
  onInspectorExpandedChange,
  main,
  onInspectorOpenChange,
  onInspectorWidthChange,
  onNavigateBack,
  onNavigateForward,
  onNavigateHome,
  onSidebarOpenChange,
  onSidebarWidthChange,
  renderHeaderTab,
  renderHeaderTabActions,
  showSidebarChrome = true,
  sidebar,
  sidebarChrome,
  sidebarMaxWidth = 520,
  sidebarMinWidth = 240,
  sidebarOpen: controlledSidebarOpen,
  sidebarWidth: controlledSidebarWidth,
  subtitle,
  title,
}: OpalineV2ShellProps) {
  const resolvedInspector = inspector ?? rightPanel;
  const resolvedInspectorMaxWidth = rightPanelMaxWidth ?? inspectorMaxWidth;
  const resolvedInspectorMinWidth = rightPanelMinWidth ?? inspectorMinWidth;
  const resolvedDefaultInspectorOpen = defaultRightPanelOpen ?? defaultInspectorOpen;
  const resolvedDefaultInspectorWidth = defaultRightPanelWidth ?? defaultInspectorWidth;
  const [uncontrolledSidebarOpen, setUncontrolledSidebarOpen] = React.useState(defaultSidebarOpen);
  const [uncontrolledInspectorOpen, setUncontrolledInspectorOpen] = React.useState(resolvedDefaultInspectorOpen);
  const [uncontrolledInspectorExpanded, setUncontrolledInspectorExpanded] = React.useState(defaultInspectorExpanded ?? false);
  const [uncontrolledBottomPanelExpanded, setUncontrolledBottomPanelExpanded] = React.useState(defaultBottomPanelExpanded ?? false);
  const [uncontrolledBottomPanelOpen, setUncontrolledBottomPanelOpen] = React.useState(defaultBottomPanelOpen ?? bottomPanel != null);
  const [uncontrolledSidebarWidth, setUncontrolledSidebarWidth] = React.useState(defaultSidebarWidth);
  const [uncontrolledInspectorWidth, setUncontrolledInspectorWidth] = React.useState(resolvedDefaultInspectorWidth);
  const [sidebarResizing, setSidebarResizing] = React.useState(false);
  const [inspectorResizing, setInspectorResizing] = React.useState(false);
  const shellRef = React.useRef<HTMLDivElement | null>(null);

  const sidebarOpen = controlledSidebarOpen ?? uncontrolledSidebarOpen;
  const inspectorOpen = controlledInspectorOpen ?? uncontrolledInspectorOpen;
  const inspectorExpanded = controlledInspectorExpanded ?? uncontrolledInspectorExpanded;
  const bottomPanelOpen = controlledBottomPanelOpen ?? uncontrolledBottomPanelOpen;
  const bottomPanelExpanded = controlledBottomPanelExpanded ?? uncontrolledBottomPanelExpanded;
  const sidebarWidth = controlledSidebarWidth ?? uncontrolledSidebarWidth;
  const inspectorWidth = controlledInspectorWidth ?? uncontrolledInspectorWidth;
  const sidebarCollapsed = sidebar != null && !sidebarOpen;
  const shellResizing = sidebarResizing || inspectorResizing;
  const resolvedCanNavigateBack = canNavigateBack ?? history?.canGoBack ?? false;
  const resolvedCanNavigateForward = canNavigateForward ?? history?.canGoForward ?? false;

  const setSidebarOpen = React.useCallback(
    (open: boolean) => {
      setUncontrolledSidebarOpen(open);
      onSidebarOpenChange?.(open);
    },
    [onSidebarOpenChange],
  );

  const setInspectorOpen = React.useCallback(
    (open: boolean) => {
      setUncontrolledInspectorOpen(open);
      onInspectorOpenChange?.(open);
    },
    [onInspectorOpenChange],
  );

  const setInspectorExpanded = React.useCallback(
    (expanded: boolean) => {
      setUncontrolledInspectorExpanded(expanded);
      onInspectorExpandedChange?.(expanded);
    },
    [onInspectorExpandedChange],
  );

  const setBottomPanelOpen = React.useCallback(
    (open: boolean) => {
      setUncontrolledBottomPanelOpen(open);
      onBottomPanelOpenChange?.(open);
    },
    [onBottomPanelOpenChange],
  );

  const setBottomPanelExpanded = React.useCallback(
    (expanded: boolean) => {
      setUncontrolledBottomPanelExpanded(expanded);
      onBottomPanelExpandedChange?.(expanded);
    },
    [onBottomPanelExpandedChange],
  );

  const navigateBack = React.useCallback(() => {
    if (onNavigateBack != null) {
      onNavigateBack();
      return;
    }

    history?.goBack();
  }, [history, onNavigateBack]);

  const navigateForward = React.useCallback(() => {
    if (onNavigateForward != null) {
      onNavigateForward();
      return;
    }

    history?.goForward();
  }, [history, onNavigateForward]);

  const navigateHome = React.useCallback(() => {
    onNavigateHome?.();
  }, [onNavigateHome]);

  const state = React.useMemo<OpalineV2ShellState>(
    () => ({
      bottomPanelOpen,
      bottomPanelExpanded,
      canNavigateBack: resolvedCanNavigateBack,
      canNavigateForward: resolvedCanNavigateForward,
      canNavigateHome: onNavigateHome != null,
      history,
      inspectorOpen,
      inspectorExpanded,
      isBottomPanelOpen: bottomPanelOpen,
      isRightPanelOpen: inspectorOpen,
      isSidebarOpen: sidebarOpen,
      navigateBack,
      navigateForward,
      navigateHome,
      setBottomPanelOpen,
      setInspectorOpen,
      setInspectorExpanded,
      setBottomPanelExpanded,
      setRightPanelOpen: setInspectorOpen,
      setSidebarOpen,
      sidebarOpen,
      toggleBottomPanel: () => setBottomPanelOpen(!bottomPanelOpen),
      toggleBottomPanelExpanded: () => setBottomPanelExpanded(!bottomPanelExpanded),
      toggleInspector: () => setInspectorOpen(!inspectorOpen),
      toggleRightPanel: () => setInspectorOpen(!inspectorOpen),
      toggleSidebar: () => setSidebarOpen(!sidebarOpen),
    }),
    [
      bottomPanelOpen,
      bottomPanelExpanded,
      history,
      inspectorOpen,
      inspectorExpanded,
      navigateBack,
      navigateForward,
      navigateHome,
      onNavigateHome,
      resolvedCanNavigateBack,
      resolvedCanNavigateForward,
      setBottomPanelOpen,
      setInspectorOpen,
      setInspectorExpanded,
      setBottomPanelExpanded,
      setSidebarOpen,
      sidebarOpen,
    ],
  );

  const startSidebarResize = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setSidebarResizing(true);
      const startX = event.clientX;
      const startWidth = sidebarWidth;
      let nextCommittedWidth = sidebarWidth;
      let nextOpen = sidebarOpen;
      let pendingWidth = sidebarWidth;
      let frame = 0;

      document.documentElement.dataset.opalinePanelResizing = "sidebar";

      function applyWidth() {
        frame = 0;
        shellRef.current?.style.setProperty("--opaline-v2-sidebar-width", `${pendingWidth}px`);
      }

      function scheduleWidth(width: number) {
        pendingWidth = width;
        if (frame) return;
        frame = window.requestAnimationFrame(applyWidth);
      }

      function move(pointerEvent: PointerEvent) {
        const nextWidth = Math.max(0, Math.min(sidebarMaxWidth, startWidth + pointerEvent.clientX - startX));
        scheduleWidth(nextWidth);
        if (nextWidth < sidebarMinWidth) {
          nextOpen = false;
          return;
        }

        nextOpen = true;
        nextCommittedWidth = nextWidth;
      }

      function stop() {
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        if (nextOpen) {
          shellRef.current?.style.setProperty("--opaline-v2-sidebar-width", `${nextCommittedWidth}px`);
        }
        delete document.documentElement.dataset.opalinePanelResizing;
        setSidebarResizing(false);
        setSidebarOpen(nextOpen);
        setUncontrolledSidebarWidth(nextCommittedWidth);
        onSidebarWidthChange?.(nextCommittedWidth);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      }

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
    },
    [onSidebarWidthChange, setSidebarOpen, sidebarMaxWidth, sidebarMinWidth, sidebarOpen, sidebarWidth],
  );

  const startInspectorResize = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setInspectorResizing(true);
      const startX = event.clientX;
      const startWidth = inspectorWidth;
      let nextCommittedWidth = inspectorWidth;
      let nextOpen = inspectorOpen;
      let pendingWidth = inspectorWidth;
      let frame = 0;

      document.documentElement.dataset.opalinePanelResizing = "inspector";

      function applyWidth() {
        frame = 0;
        shellRef.current?.style.setProperty("--opaline-v2-inspector-width", `${pendingWidth}px`);
      }

      function scheduleWidth(width: number) {
        pendingWidth = width;
        if (frame) return;
        frame = window.requestAnimationFrame(applyWidth);
      }

      function move(pointerEvent: PointerEvent) {
        const nextWidth = Math.max(0, Math.min(resolvedInspectorMaxWidth, startWidth - (pointerEvent.clientX - startX)));
        scheduleWidth(nextWidth);
        if (nextWidth < resolvedInspectorMinWidth) {
          nextOpen = false;
          return;
        }

        nextOpen = true;
        nextCommittedWidth = nextWidth;
      }

      function stop() {
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        if (nextOpen) {
          shellRef.current?.style.setProperty("--opaline-v2-inspector-width", `${nextCommittedWidth}px`);
        }
        delete document.documentElement.dataset.opalinePanelResizing;
        setInspectorResizing(false);
        setInspectorOpen(nextOpen);
        setUncontrolledInspectorWidth(nextCommittedWidth);
        onInspectorWidthChange?.(nextCommittedWidth);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      }

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
    },
    [inspectorOpen, inspectorWidth, onInspectorWidthChange, resolvedInspectorMaxWidth, resolvedInspectorMinWidth, setInspectorOpen],
  );

  const actionContent = resolveSlot(actions ?? headerActions, state);
  const headerContent = resolveSlot(header, state);
  const bottomPanelContent = resolveSlot(bottomPanel, state);
  const sidebarChromeContent =
    sidebarChrome != null ? resolveSlot(sidebarChrome, state) : <OpalineV2NavigationControls state={state} />;
  const collapsedTriggerContent =
    collapsedSidebarTrigger != null ? (
      resolveSlot(collapsedSidebarTrigger, state)
    ) : (
      <OpalineV2CollapsedSidebarTrigger
        aria-label={state.sidebarOpen ? "Close sidebar" : "Open sidebar"}
        onClick={state.toggleSidebar}
      >
        <SidebarToggleIcon active={false} />
      </OpalineV2CollapsedSidebarTrigger>
    );

  const shell = (
    <TooltipProvider>
      <div
        ref={shellRef}
        className={cn("opaline-app-shell flex h-full min-h-0 w-full overflow-hidden bg-transparent text-foreground antialiased", className)}
        data-bottom-panel-open={bottomPanel != null && bottomPanelOpen ? "true" : "false"}
        data-inspector-open={resolvedInspector != null && inspectorOpen ? "true" : "false"}
        data-resizing={shellResizing ? "true" : "false"}
        data-sidebar-open={sidebar != null && sidebarOpen ? "true" : "false"}
        style={
          {
            "--opaline-v2-inspector-width": (inspectorExpanded && inspectorOpen) ? "calc(100vw - var(--opaline-v2-sidebar-width))" : `${inspectorWidth}px`,
            "--opaline-v2-sidebar-max-width": `${sidebarMaxWidth}px`,
            "--opaline-v2-sidebar-min-content": `${sidebarMinWidth + 96}px`,
            "--opaline-v2-sidebar-width": sidebarOpen ? `${sidebarWidth}px` : "0px",
          } as React.CSSProperties
        }
      >
        {sidebar != null ? (
          <aside
            className={cn(
              "relative h-full min-h-0 shrink-0 overflow-visible border-r border-sidebar-border/60 bg-sidebar/45 backdrop-blur-[30px] backdrop-saturate-[1.75] transition-none",
              "opaline-v2-sidebar-pane",
              sidebarOpen ? "w-[var(--opaline-v2-sidebar-width)] opacity-100" : "pointer-events-none w-0 opacity-0"
            )}
            data-open={sidebarOpen ? "true" : "false"}
            data-resizing={sidebarResizing ? "true" : "false"}
          >
            {showSidebarChrome ? <div className="flex h-11 items-center gap-1 bg-transparent px-3 pl-24 [-webkit-app-region:drag] [&>*]:[-webkit-app-region:no-drag]">{sidebarChromeContent}</div> : null}
            <div className="absolute inset-x-0 bottom-0 top-11 flex min-h-0 flex-col overflow-hidden">{sidebar}</div>
            <div
              aria-disabled={!sidebarOpen}
              aria-orientation="vertical"
              className="absolute inset-y-0 -right-2 z-50 flex w-4 cursor-col-resize touch-none select-none"
              onPointerDown={sidebarOpen ? startSidebarResize : undefined}
              role="separator"
            >
              <div className="m-auto h-full w-px bg-border opacity-0 transition-opacity hover:opacity-100" />
            </div>
          </aside>
        ) : null}
        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background/95">
          <header className="relative z-30 flex h-11 min-h-11 min-w-0 items-end justify-between gap-3 bg-background/95 px-3 pb-1.5 select-none backdrop-blur supports-[backdrop-filter]:bg-background/85 [-webkit-app-region:drag]">
            {sidebar != null ? (
              <div
                className={cn(
                  "absolute left-24 top-2 z-40 flex items-center gap-1 transition-none [-webkit-app-region:no-drag]",
                  sidebarOpen && "pointer-events-none -translate-x-1 opacity-0",
                  !sidebarOpen && "translate-x-0 opacity-100"
                )}
              >
                {collapsedTriggerContent}
              </div>
            ) : null}
            <div className={cn(
              "flex min-w-0 flex-1 items-center gap-3 overflow-hidden transition-none",
              sidebarCollapsed && "pl-36"
            )}>
              {headerTabs.length > 0 ? (
                <div className="flex h-full min-w-0 items-center gap-1 [-webkit-app-region:no-drag]">
                  {headerTabs.map((tab) => (
                    <div className="relative inline-flex min-w-0 max-w-56 shrink-0 items-center gap-1" data-tab-id={tab.id} key={tab.id}>
                      {renderHeaderTab?.(tab, state) ?? <OpalineV2HeaderTab tab={tab} />}
                      {renderHeaderTabActions?.(tab, state)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="min-w-0">
                  {title != null ? <div className="truncate text-sm font-medium">{title}</div> : null}
                  {subtitle != null ? <div className="truncate text-xs text-muted-foreground">{subtitle}</div> : null}
                </div>
              )}
              {headerContent}
            </div>
            <div className="inline-flex items-center gap-1 pb-px [-webkit-app-region:no-drag]">
              {actionContent}
            </div>
          </header>
          <div
            className="grid min-h-0 flex-1 overflow-hidden max-[980px]:grid-cols-1"
            style={{
              gridTemplateColumns: (!resolvedInspector || !inspectorOpen) ? "minmax(0, 1fr) 0px" : "minmax(0, 1fr) var(--opaline-v2-inspector-width)",
              transition: "none",
            }}
          >
            <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
              <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{main}</main>
              {composer != null ? <footer>{composer}</footer> : null}
              {bottomPanelContent != null ? (
                <section
                  className={cn(
                    "relative z-40 min-h-0 w-full overflow-hidden border-t border-border/60 transition-none",
                    "opaline-v2-bottom-panel-frame",
                    bottomPanelOpen
                      ? bottomPanelExpanded
                        ? "h-full basis-full shrink-0 opacity-100"
                        : "h-[var(--opaline-v2-bottom-panel-height,260px)] basis-[var(--opaline-v2-bottom-panel-height,260px)] opacity-100"
                      : "pointer-events-none h-0 basis-0 opacity-0"
                  )}
                  data-open={bottomPanelOpen ? "true" : "false"}
                >
                  {bottomPanelContent}
                </section>
              ) : null}
            </section>
            {resolvedInspector != null ? (
              <aside
                className={cn(
                  "relative z-20 h-full min-h-0 shrink-0 overflow-visible transition-none max-[980px]:hidden",
                  "opaline-v2-inspector-pane",
                  inspectorOpen ? "w-[var(--opaline-v2-inspector-width)] opacity-100" : "pointer-events-none w-0 opacity-0"
                )}
                data-open={inspectorOpen ? "true" : "false"}
                data-resizing={inspectorResizing ? "true" : "false"}
              >
                {!(inspectorExpanded && inspectorOpen) && (
                  <div
                    aria-disabled={!inspectorOpen}
                    aria-orientation="vertical"
                    className="absolute inset-y-0 -left-2 z-50 flex w-4 cursor-col-resize touch-none select-none"
                    onPointerDown={inspectorOpen ? startInspectorResize : undefined}
                    role="separator"
                  >
                    <div className="m-auto h-full w-px bg-border opacity-0 transition-opacity hover:opacity-100" />
                  </div>
                )}
                <div className="opaline-v2-inspector-surface absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-hidden bg-card/78 border-l border-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/68">{resolvedInspector}</div>
              </aside>
            ) : null}
          </div>
        </section>
      </div>
    </TooltipProvider>
  );

  return history != null ? <ShellHistoryProvider history={history}>{shell}</ShellHistoryProvider> : shell;
}

export function OpalineV2Sidebar({
  className,
  footer,
  header,
  renderItem,
  reserveWindowControls = false,
  sections = [],
  subtitle,
  title,
}: OpalineV2SidebarProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className={cn("flex min-h-10 items-center px-3 py-2 [-webkit-app-region:drag] [&>*]:[-webkit-app-region:no-drag]", reserveWindowControls && "pl-20")} data-reserve-window-controls={reserveWindowControls ? "true" : "false"}>
        {header ?? (
          <div className="min-w-0">
            {title != null ? <div className="truncate text-[13px] font-semibold">{title}</div> : null}
            {subtitle != null ? <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div> : null}
          </div>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        {sections.map((section) => (
          <div className="flex flex-col gap-1 py-1" key={section.id}>
            {section.label != null ? <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{section.label}</div> : null}
            {section.items.map((item) => (
              <React.Fragment key={item.id}>
                {renderItem != null ? renderItem(item) : <OpalineV2SidebarItemButton item={item} />}
              </React.Fragment>
            ))}
          </div>
        ))}
      </ScrollArea>
      {footer != null ? <div className="flex min-h-12 items-center justify-between px-3 py-2 [-webkit-app-region:no-drag]">{footer}</div> : null}
    </div>
  );
}

export function OpalineV2SidebarItemButton({ item }: { item: OpalineV2SidebarItem }) {
  return (
    <Button
      className="grid h-auto min-h-8 w-full grid-cols-[1.125rem_minmax(0,1fr)_auto] justify-stretch gap-2 px-2 text-left data-[active=true]:bg-accent"
      data-active={item.active ? "true" : undefined}
      disabled={item.disabled}
      onClick={item.onSelect}
      size="default"
      type="button"
      variant="ghost"
    >
      <span className="inline-grid size-[1.125rem] place-items-center">{item.icon}</span>
      <span className="truncate">{item.label}</span>
      {item.meta != null ? <span className="truncate text-xs text-muted-foreground">{item.meta}</span> : null}
    </Button>
  );
}

export function OpalineV2NavigationControls({
  state,
  variant = "sidebar",
}: {
  state: OpalineV2ShellState;
  variant?: "collapsed" | "sidebar";
}) {
  const Control = variant === "collapsed" ? OpalineV2CollapsedSidebarTrigger : OpalineV2ChromeButton;

  return (
    <>
      <Control aria-label={state.sidebarOpen ? "Close sidebar" : "Open sidebar"} onClick={state.toggleSidebar}>
        <SidebarToggleIcon active={variant === "collapsed"} />
      </Control>
      <Control aria-label="Home" disabled={!state.canNavigateHome} onClick={state.navigateHome}>
        <HouseIcon />
      </Control>
      <Control aria-label="Back" disabled={!state.canNavigateBack} onClick={state.navigateBack}>
        <ArrowLeftIcon />
      </Control>
      <Control aria-label="Forward" disabled={!state.canNavigateForward} onClick={state.navigateForward}>
        <ArrowRightIcon />
      </Control>
    </>
  );
}

export function OpalineV2ChromeButton({ className, type = "button", ...props }: OpalineV2ShellButtonProps) {
  return <Button className={cn("rounded-[10px] text-muted-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground", className)} size="icon" type={type} variant="ghost" {...props} />;
}

export function OpalineV2CollapsedSidebarTrigger({ className, type = "button", ...props }: OpalineV2ShellButtonProps) {
  return <Button className={cn("rounded-[10px] text-muted-foreground", className)} size="icon" type={type} variant="ghost" {...props} />;
}

export function OpalineV2HeaderToolButton({
  children,
  className,
  label,
  pressed,
  type = "button",
  ...props
}: OpalineV2ShellButtonProps & {
  label?: string;
  pressed?: boolean;
}) {
  const button = (
    <Button
      aria-label={label}
      aria-pressed={pressed}
      className={cn("rounded-[10px] text-muted-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground", className)}
      size="icon"
      variant="ghost"
      type={type}
      {...props}
    >
      {children}
    </Button>
  );

  if (label == null) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ShellIconButton(props: OpalineV2ShellButtonProps & { label: string; pressed?: boolean }) {
  return <OpalineV2HeaderToolButton {...props} />;
}

export const AppShellChromeButton = OpalineV2ChromeButton;
export const AppShellCollapsedSidebarTrigger = OpalineV2CollapsedSidebarTrigger;
export const AppShellHeaderToolButton = OpalineV2HeaderToolButton;

type AppShellSlotProps = React.HTMLAttributes<HTMLElement>;

function ShellSlot({ as: Component = "div", className, ...props }: AppShellSlotProps & { as?: "div" | "header" | "section" }) {
  return <Component className={className} {...props} />;
}

export function AppShellChromeControls(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("flex items-center gap-1", props.className)} />;
}

export function AppShellSidebarChrome(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("flex h-11 items-center gap-1 px-3", props.className)} />;
}

export function AppShellNavigationControls({ onHome, state, variant = "sidebar" }: {
  onHome?: () => void;
  state: OpalineV2ShellState;
  variant?: "collapsed" | "sidebar";
}) {
  return <OpalineV2NavigationControls state={{ ...state, navigateHome: onHome ?? state.navigateHome }} variant={variant} />;
}

export function AppShellHeader(props: AppShellSlotProps) {
  return <ShellSlot {...props} as="header" className={cn("flex h-11 items-center justify-between gap-3 px-3", props.className)} />;
}

export function AppShellHeaderContextSurface(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("flex min-w-0 flex-1 items-center gap-3 overflow-hidden", props.className)} />;
}

export function AppShellTabStrip(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("flex h-full min-w-0 items-center gap-1", props.className)} />;
}

export function AppShellTabController(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("relative inline-flex min-w-0 max-w-56 items-center gap-1", props.className)} />;
}

export function AppShellTab({ tab, ...props }: OpalineV2ShellButtonProps & { tab?: OpalineV2ShellTabItem }) {
  return <OpalineV2HeaderTab tab={tab ?? { id: "tab", title: props.children }} {...props} />;
}

export function AppShellTabActions(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("inline-flex items-center gap-1", props.className)} />;
}

export function AppShellTabActionButton(props: OpalineV2ShellButtonProps) {
  return <OpalineV2HeaderToolButton {...props} />;
}

export function AppShellHeaderActions(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("inline-flex items-center gap-1", props.className)} />;
}

export function AppShellHeaderPillButton({ className, ...props }: OpalineV2ShellButtonProps) {
  return <Button className={className} size="sm" variant="outline" {...props} />;
}

export function AppShellContent(props: AppShellSlotProps) {
  return <ShellSlot {...props} as="section" className={cn("min-h-0 min-w-0 flex-1 overflow-hidden", props.className)} />;
}

export function AppShellComposer(props: AppShellSlotProps) {
  return <ShellSlot {...props} as="section" className={cn(props.className)} />;
}

export function AppShellRightPanel(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("flex min-h-0 flex-col overflow-hidden bg-card/85", props.className)} />;
}

export function AppShellBottomPanel(props: AppShellSlotProps) {
  return <ShellSlot {...props} className={cn("h-full min-h-0 overflow-hidden", props.className)} />;
}

export function OpalineV2InspectorIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect height="12" rx="2.75" stroke="currentColor" strokeWidth="1.55" width="13.5" x="3.25" y="4" />
      <path d="M10 4v12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
    </svg>
  );
}

export function OpalineV2HeaderTab({
  className,
  tab,
  type = "button",
  ...props
}: OpalineV2ShellButtonProps & { tab: OpalineV2ShellTabItem }) {
  return (
    <Button className={cn("max-w-48 rounded-lg data-[active=true]:shadow-sm", className)} data-active={tab.active ? "true" : undefined} size="sm" type={type} variant={tab.active ? "secondary" : "ghost"} {...props}>
      {tab.dirty ? <span className="size-2 rounded-full bg-primary" /> : null}
      <span className="truncate">{tab.title}</span>
    </Button>
  );
}

function resolveSlot<TState>(
  slot: React.ReactNode | ((state: TState) => React.ReactNode) | undefined,
  state: TState,
) {
  return typeof slot === "function" ? slot(state) : slot;
}

function SidebarToggleIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.5" width="13" x="3.5" y="4.5" />
      <path d="M7.5 4.5v11" stroke="currentColor" strokeWidth="1.5" />
      {active ? (
        <circle
          cx="16.5"
          cy="4.5"
          fill="#007aff"
          r="2.5"
          stroke="var(--background)"
          strokeWidth="1.5"
        />
      ) : null}
    </svg>
  );
}

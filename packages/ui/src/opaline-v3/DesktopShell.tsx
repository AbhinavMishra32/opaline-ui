import * as React from "react";
import { ArrowLeft, ArrowRight, House } from "lucide-react";

import { Button } from "../components/button";
import { DesktopHeaderIconButton } from "../components/desktop-header-controls";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import type { ShellHistoryController } from "../history/ShellHistory";
import { cn } from "../lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInstanceProvider,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
  SIDEBAR_OFFCANVAS_MOTION_CLASS,
} from "../components/sidebar";

export type DesktopShellTabItem = {
  active?: boolean;
  dirty?: boolean;
  id: string;
  title: React.ReactNode;
};

export type DesktopShellState = {
  bottomPanelExpanded: boolean;
  bottomPanelOpen: boolean;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
  canNavigateHome: boolean;
  history?: ShellHistoryController<any>;
  inspectorExpanded: boolean;
  inspectorOpen: boolean;
  isBottomPanelOpen: boolean;
  isRightPanelOpen: boolean;
  isSidebarOpen: boolean;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateHome: () => void;
  setBottomPanelExpanded: (expanded: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
  setInspectorExpanded: (expanded: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  toggleBottomPanel: () => void;
  toggleBottomPanelExpanded: () => void;
  toggleInspector: () => void;
  toggleRightPanel: () => void;
  toggleSidebar: () => void;
};

type DesktopShellSlot = React.ReactNode | ((state: DesktopShellState) => React.ReactNode);

export type DesktopShellProps = {
  actions?: DesktopShellSlot;
  bottomPanel?: DesktopShellSlot;
  bottomPanelExpanded?: boolean;
  bottomPanelOpen?: boolean;
  canNavigateBack?: boolean;
  canNavigateForward?: boolean;
  className?: string;
  collapsedSidebarTrigger?: DesktopShellSlot;
  composer?: React.ReactNode;
  defaultBottomPanelExpanded?: boolean;
  defaultBottomPanelOpen?: boolean;
  defaultInspectorExpanded?: boolean;
  defaultInspectorOpen?: boolean;
  defaultInspectorWidth?: number;
  defaultRightPanelOpen?: boolean;
  defaultRightPanelWidth?: number;
  defaultSidebarOpen?: boolean;
  defaultSidebarWidth?: number;
  header?: DesktopShellSlot;
  headerActions?: DesktopShellSlot;
  headerTabs?: DesktopShellTabItem[];
  history?: ShellHistoryController<any>;
  inspector?: React.ReactNode;
  inspectorExpanded?: boolean;
  inspectorMaxWidth?: number;
  inspectorMinWidth?: number;
  inspectorOpen?: boolean;
  inspectorWidth?: number;
  main: React.ReactNode;
  onBottomPanelExpandedChange?: (expanded: boolean) => void;
  onBottomPanelOpenChange?: (open: boolean) => void;
  onInspectorExpandedChange?: (expanded: boolean) => void;
  onInspectorOpenChange?: (open: boolean) => void;
  onInspectorWidthChange?: (width: number) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onNavigateHome?: () => void;
  onSidebarOpenChange?: (open: boolean) => void;
  onSidebarWidthChange?: (width: number) => void;
  renderHeaderTab?: (tab: DesktopShellTabItem, state: DesktopShellState) => React.ReactNode;
  renderHeaderTabActions?: (tab: DesktopShellTabItem, state: DesktopShellState) => React.ReactNode;
  rightPanel?: React.ReactNode;
  rightPanelMaxWidth?: number;
  rightPanelMinWidth?: number;
  showSidebarChrome?: boolean;
  sidebar?: React.ReactNode;
  sidebarChrome?: DesktopShellSlot;
  sidebarMaxWidth?: number;
  sidebarMinWidth?: number;
  sidebarOpen?: boolean;
  sidebarWidth?: number;
  subtitle?: React.ReactNode;
  title?: React.ReactNode;
};

export type DesktopSidebarItem = {
  active?: boolean;
  id: string;
  meta?: React.ReactNode;
  time?: React.ReactNode;
  title: React.ReactNode;
};

export type DesktopSidebarNavItem = {
  active?: boolean;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  id: string;
  label: React.ReactNode;
  onClick?: () => void;
};

export type DesktopSidebarProject = {
  active?: boolean;
  collapsed?: boolean;
  icon?: React.ReactNode;
  id: string;
  label: React.ReactNode;
  threads?: DesktopSidebarItem[];
};

export type DesktopChromeButtonProps = Omit<
  React.ComponentProps<typeof DesktopHeaderIconButton>,
  "label"
> & {
  "aria-label": string;
};

const SIDEBAR_GAP_CLASS =
  "overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(90%_75%_at_0%_0%,rgba(255,255,255,0.06),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008))] dark:before:bg-[radial-gradient(90%_75%_at_0%_0%,rgba(255,255,255,0.04),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.018),rgba(255,255,255,0.006))]";

/**
 * The desktop shell is composed from the extracted source sidebar provider,
 * off-canvas sidebar, seam rail, and inset surface. Construct supplies content
 * through slots; it does not own the shell DOM.
 */
export function DesktopShell({
  actions,
  headerActions,
  bottomPanel,
  bottomPanelExpanded: controlledBottomPanelExpanded,
  bottomPanelOpen: controlledBottomPanelOpen,
  canNavigateBack,
  canNavigateForward,
  className,
  collapsedSidebarTrigger,
  composer,
  defaultBottomPanelExpanded = false,
  defaultBottomPanelOpen,
  defaultInspectorExpanded = false,
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
  inspectorExpanded: controlledInspectorExpanded,
  inspectorMaxWidth = 560,
  inspectorMinWidth = 260,
  inspectorOpen: controlledInspectorOpen,
  inspectorWidth: controlledInspectorWidth,
  main,
  onBottomPanelExpandedChange,
  onBottomPanelOpenChange,
  onInspectorExpandedChange,
  onInspectorOpenChange,
  onInspectorWidthChange,
  onNavigateBack,
  onNavigateForward,
  onNavigateHome,
  onSidebarOpenChange,
  onSidebarWidthChange,
  renderHeaderTab,
  renderHeaderTabActions,
  rightPanel,
  rightPanelMaxWidth,
  rightPanelMinWidth,
  sidebar,
  sidebarChrome,
  sidebarMaxWidth = 520,
  sidebarMinWidth = 240,
  sidebarOpen: controlledSidebarOpen,
  sidebarWidth: controlledSidebarWidth,
  showSidebarChrome = true,
  subtitle,
  title,
}: DesktopShellProps) {
  const resolvedInspector = inspector ?? rightPanel;
  const [internalSidebarOpen, setInternalSidebarOpen] = React.useState(defaultSidebarOpen);
  const [internalInspectorOpen, setInternalInspectorOpen] = React.useState(defaultRightPanelOpen ?? defaultInspectorOpen);
  const [internalInspectorExpanded, setInternalInspectorExpanded] = React.useState(defaultInspectorExpanded);
  const [internalBottomPanelOpen, setInternalBottomPanelOpen] = React.useState(defaultBottomPanelOpen ?? bottomPanel != null);
  const [internalBottomPanelExpanded, setInternalBottomPanelExpanded] = React.useState(defaultBottomPanelExpanded);
  const [internalInspectorWidth, setInternalInspectorWidth] = React.useState(defaultRightPanelWidth ?? defaultInspectorWidth);
  const sidebarOpen = controlledSidebarOpen ?? internalSidebarOpen;
  const inspectorOpen = controlledInspectorOpen ?? internalInspectorOpen;
  const inspectorExpanded = controlledInspectorExpanded ?? internalInspectorExpanded;
  const bottomPanelOpen = controlledBottomPanelOpen ?? internalBottomPanelOpen;
  const bottomPanelExpanded = controlledBottomPanelExpanded ?? internalBottomPanelExpanded;
  const inspectorWidth = controlledInspectorWidth ?? internalInspectorWidth;
  const sidebarWidth = controlledSidebarWidth ?? defaultSidebarWidth;

  const setSidebarOpen = React.useCallback((open: boolean) => {
    if (controlledSidebarOpen === undefined) setInternalSidebarOpen(open);
    onSidebarOpenChange?.(open);
  }, [controlledSidebarOpen, onSidebarOpenChange]);
  const setInspectorOpen = React.useCallback((open: boolean) => {
    if (controlledInspectorOpen === undefined) setInternalInspectorOpen(open);
    onInspectorOpenChange?.(open);
  }, [controlledInspectorOpen, onInspectorOpenChange]);
  const setInspectorExpanded = React.useCallback((expanded: boolean) => {
    if (controlledInspectorExpanded === undefined) setInternalInspectorExpanded(expanded);
    onInspectorExpandedChange?.(expanded);
  }, [controlledInspectorExpanded, onInspectorExpandedChange]);
  const setBottomPanelOpen = React.useCallback((open: boolean) => {
    if (controlledBottomPanelOpen === undefined) setInternalBottomPanelOpen(open);
    onBottomPanelOpenChange?.(open);
  }, [controlledBottomPanelOpen, onBottomPanelOpenChange]);
  const setBottomPanelExpanded = React.useCallback((expanded: boolean) => {
    if (controlledBottomPanelExpanded === undefined) setInternalBottomPanelExpanded(expanded);
    onBottomPanelExpandedChange?.(expanded);
  }, [controlledBottomPanelExpanded, onBottomPanelExpandedChange]);
  const navigateBack = React.useCallback(() => {
    if (onNavigateBack) onNavigateBack();
    else history?.goBack();
  }, [history, onNavigateBack]);
  const navigateForward = React.useCallback(() => {
    if (onNavigateForward) onNavigateForward();
    else history?.goForward();
  }, [history, onNavigateForward]);
  const navigateHome = React.useCallback(() => onNavigateHome?.(), [onNavigateHome]);

  const state = React.useMemo<DesktopShellState>(() => ({
    bottomPanelExpanded,
    bottomPanelOpen,
    canNavigateBack: canNavigateBack ?? history?.canGoBack ?? false,
    canNavigateForward: canNavigateForward ?? history?.canGoForward ?? false,
    canNavigateHome: onNavigateHome != null,
    history,
    inspectorExpanded,
    inspectorOpen,
    isBottomPanelOpen: bottomPanelOpen,
    isRightPanelOpen: inspectorOpen,
    isSidebarOpen: sidebarOpen,
    navigateBack,
    navigateForward,
    navigateHome,
    setBottomPanelExpanded,
    setBottomPanelOpen,
    setInspectorExpanded,
    setInspectorOpen,
    setRightPanelOpen: setInspectorOpen,
    setSidebarOpen,
    sidebarOpen,
    toggleBottomPanel: () => setBottomPanelOpen(!bottomPanelOpen),
    toggleBottomPanelExpanded: () => setBottomPanelExpanded(!bottomPanelExpanded),
    toggleInspector: () => setInspectorOpen(!inspectorOpen),
    toggleRightPanel: () => setInspectorOpen(!inspectorOpen),
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
  }), [
    bottomPanelExpanded, bottomPanelOpen, canNavigateBack, canNavigateForward, history,
    inspectorExpanded, inspectorOpen, navigateBack, navigateForward, navigateHome,
    onNavigateHome, setBottomPanelExpanded, setBottomPanelOpen, setInspectorExpanded,
    setInspectorOpen, setSidebarOpen, sidebarOpen,
  ]);

  const sidebarChromeContent = sidebarChrome != null
    ? resolveSlot(sidebarChrome, state)
    : <DesktopNavigationControls state={state} />;
  const collapsedTriggerContent = collapsedSidebarTrigger != null
    ? resolveSlot(collapsedSidebarTrigger, state)
    : <DesktopNavigationControls state={state} />;
  const headerContent = resolveSlot(header, state);
  const actionContent = resolveSlot(actions ?? headerActions, state);
  const bottomPanelContent = resolveSlot(bottomPanel, state);

  function beginInspectorResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = inspectorWidth;
    const move = (pointerEvent: PointerEvent) => {
      const next = Math.max(
        rightPanelMinWidth ?? inspectorMinWidth,
        Math.min(rightPanelMaxWidth ?? inspectorMaxWidth, startWidth - (pointerEvent.clientX - startX)),
      );
      setInternalInspectorWidth(next);
      onInspectorWidthChange?.(next);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  }

  return (
    <SidebarProvider
      className={cn("opaline-v3-desktop-shell h-full min-h-0 overflow-hidden bg-[var(--app-shell-background)] text-foreground antialiased", className)}
      data-sidebar-side="left"
      defaultOpen={defaultSidebarOpen}
      open={sidebar != null ? sidebarOpen : false}
      onOpenChange={setSidebarOpen}
      style={{ "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}
    >
      {sidebar != null ? (
        <Sidebar
          className={cn("text-foreground", SIDEBAR_OFFCANVAS_MOTION_CLASS)}
          gapClassName={cn(SIDEBAR_GAP_CLASS, SIDEBAR_OFFCANVAS_MOTION_CLASS)}
          innerClassName="app-sidebar-surface"
          resizable={{
            maxWidth: sidebarMaxWidth,
            minWidth: sidebarMinWidth,
            onResize: onSidebarWidthChange,
          }}
          transparentSurface
        >
          {showSidebarChrome ? (
            <div data-tauri-drag-region className="flex h-[46px] shrink-0 items-center gap-0.5 px-3 pl-[83px] [-webkit-app-region:drag] [&>*]:[-webkit-app-region:no-drag]">
              {sidebarChromeContent}
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-hidden">{sidebar}</div>
        </Sidebar>
      ) : null}

      <div className="chat-content-card-backing relative flex h-svh min-h-0 min-w-0 flex-1">
        {sidebar != null ? (
          <SidebarInstanceProvider
            resizable={{ maxWidth: sidebarMaxWidth, minWidth: sidebarMinWidth, onResize: onSidebarWidthChange }}
          >
            <SidebarRail placement="content-seam" />
          </SidebarInstanceProvider>
        ) : null}
        <SidebarInset surfaceClassName="chat-content-card relative z-[15] overflow-hidden bg-background">
          <header data-tauri-drag-region className="chat-surface-divider relative z-30 flex h-[46px] min-h-[46px] items-center justify-between gap-3 px-3 select-none sm:px-5 [-webkit-app-region:drag]">
            {sidebar != null && !sidebarOpen ? (
              <div className="absolute left-[83px] top-[9px] z-40 flex items-center gap-0.5 [-webkit-app-region:no-drag]">
                {collapsedTriggerContent}
              </div>
            ) : null}
            <div className={cn("flex min-w-0 flex-1 items-center gap-3 overflow-hidden", sidebar != null && !sidebarOpen && "pl-52")}>
              {headerTabs.length > 0 ? (
                <div className="flex min-w-0 items-center gap-1 [-webkit-app-region:no-drag]">
                  {headerTabs.map((tab) => (
                    <div className="relative inline-flex min-w-0 max-w-56 shrink-0 items-center gap-1" data-tab-id={tab.id} key={tab.id}>
                      {renderHeaderTab?.(tab, state) ?? <DesktopHeaderTab tab={tab} />}
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
            <div className="inline-flex items-center gap-1 [-webkit-app-region:no-drag]">{actionContent}</div>
          </header>

          <div
            className="grid min-h-0 flex-1 overflow-hidden max-[980px]:grid-cols-1"
            style={{ gridTemplateColumns: resolvedInspector && inspectorOpen ? `minmax(0,1fr) ${inspectorExpanded ? "calc(100vw - var(--sidebar-width))" : `${inspectorWidth}px`}` : "minmax(0,1fr) 0px" }}
          >
            <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
              <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{main}</main>
              {composer != null ? <footer>{composer}</footer> : null}
              {bottomPanelContent != null ? (
                <section
                  className={cn(
                    "relative z-40 min-h-0 overflow-hidden border-t transition-[height,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    bottomPanelOpen
                      ? bottomPanelExpanded ? "h-full" : "h-[var(--app-shell-bottom-panel-height,260px)]"
                      : "pointer-events-none h-0 opacity-0",
                  )}
                  data-open={bottomPanelOpen ? "true" : "false"}
                  data-slot="desktop-bottom-panel"
                >
                  {bottomPanelContent}
                </section>
              ) : null}
            </section>
            {resolvedInspector != null ? (
              <aside className={cn("relative min-h-0 overflow-hidden max-[980px]:hidden", inspectorOpen ? "opacity-100" : "pointer-events-none opacity-0")}>
                {!inspectorExpanded ? <div className="absolute inset-y-0 -left-2 z-50 w-4 cursor-col-resize" onPointerDown={beginInspectorResize} role="separator" /> : null}
                <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden border-l bg-card/78" data-slot="desktop-inspector-surface">{resolvedInspector}</div>
              </aside>
            ) : null}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function DesktopNavigationControls({ state }: { state: DesktopShellState }) {
  const platform = typeof navigator === "undefined" ? "" : navigator.platform;
  const isMac = /Mac|iPhone|iPad|iPod/i.test(platform);
  return (
    <div className="-ms-1 flex shrink-0 items-center gap-0.5 [-webkit-app-region:no-drag]">
      <SidebarTrigger
        aria-label={state.sidebarOpen ? "Close sidebar" : "Open sidebar"}
        className="size-7 shrink-0 rounded-lg text-muted-foreground/75 hover:text-foreground"
      />
      <DesktopNavigationButton label="Home" disabled={!state.canNavigateHome} onClick={state.navigateHome}>
        <House className="size-4" strokeWidth={1.8} />
      </DesktopNavigationButton>
      <DesktopNavigationButton label="Back" shortcut={isMac ? "⌘[" : "Alt+Left"} disabled={!state.canNavigateBack} onClick={state.navigateBack}>
        <ArrowLeft className="size-6" strokeWidth={1.7} />
      </DesktopNavigationButton>
      <DesktopNavigationButton label="Forward" shortcut={isMac ? "⌘]" : "Alt+Right"} disabled={!state.canNavigateForward} onClick={state.navigateForward}>
        <ArrowRight className="size-6" strokeWidth={1.7} />
      </DesktopNavigationButton>
    </div>
  );
}

function DesktopNavigationButton({ children, label, shortcut, ...props }: React.ComponentProps<typeof Button> & { label: string; shortcut?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <Button
            {...props}
            aria-label={label}
            className={cn(
              "size-8 rounded-lg",
              props.className,
            )}
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        )}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}{shortcut ? ` (${shortcut})` : ""}</TooltipContent>
    </Tooltip>
  );
}

/** Source desktop chrome primitive used by Construct-owned shell actions. */
export function DesktopChromeButton({ "aria-label": label, ...props }: DesktopChromeButtonProps) {
  return (
    <DesktopHeaderIconButton
      {...props}
      label={label}
    />
  );
}

export function DesktopHeaderToolButton(props: DesktopChromeButtonProps) {
  return <DesktopChromeButton {...props} />;
}

function DesktopHeaderTab({ tab }: { tab: DesktopShellTabItem }) {
  return (
    <Button
      className="max-w-48 rounded-lg data-[active=true]:shadow-sm"
      data-active={tab.active ? "true" : undefined}
      size="sm"
      type="button"
      variant={tab.active ? "secondary" : "ghost"}
    >
      {tab.dirty ? <span className="size-2 rounded-full bg-primary" /> : null}
      <span className="truncate">{tab.title}</span>
    </Button>
  );
}

export type DesktopSidebarProps = {
  children?: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  items?: DesktopSidebarItem[];
  onProjectSelect?: (projectId: string) => void;
  primaryItems?: DesktopSidebarNavItem[];
  projects?: DesktopSidebarProject[];
  renderItem?: (item: DesktopSidebarItem, options: { inset: boolean }) => React.ReactNode;
  renderNavItem?: (item: DesktopSidebarNavItem) => React.ReactNode;
  renderProject?: (project: DesktopSidebarProject) => React.ReactNode;
  sectionLabels?: { items?: string; projects?: string };
  viewSwitcher?: React.ReactNode;
};

/** Construct data rendered through the extracted source sidebar primitives. */
export function DesktopSidebar({
  children,
  footer,
  header,
  items = [],
  onProjectSelect,
  primaryItems = [],
  projects = [],
  renderItem,
  renderNavItem,
  renderProject,
  sectionLabels = { items: "Items", projects: "Projects" },
  viewSwitcher,
}: DesktopSidebarProps) {
  return (
    <div className="opaline-v3-sidebar flex h-full min-h-0 flex-col font-sans">
      {header != null || viewSwitcher != null ? (
        <SidebarHeader>
          {header}
          {viewSwitcher}
        </SidebarHeader>
      ) : null}
      <SidebarContent>
        {primaryItems.length > 0 ? (
          <SidebarGroup>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {renderNavItem?.(item) ?? <DesktopSidebarNavRow item={item} />}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
        {projects.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>{sectionLabels.projects ?? "Projects"}</SidebarGroupLabel>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  {renderProject?.(project) ?? <DesktopSidebarProjectRow project={project} onSelect={onProjectSelect} renderItem={renderItem} />}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
        {items.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>{sectionLabels.items ?? "Items"}</SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {renderItem?.(item, { inset: false }) ?? <DesktopSidebarItemRow item={item} />}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
        {children}
      </SidebarContent>
      {footer != null ? <><SidebarSeparator /><SidebarFooter>{footer}</SidebarFooter></> : null}
    </div>
  );
}

function DesktopSidebarNavRow({ item }: { item: DesktopSidebarNavItem }) {
  return (
    <SidebarMenuButton isActive={item.active === true} onClick={item.onClick}>
      {item.icon != null ? <span className="grid size-4 shrink-0 place-items-center">{item.icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge}
    </SidebarMenuButton>
  );
}

function DesktopSidebarItemRow({ inset = false, item }: { inset?: boolean; item: DesktopSidebarItem }) {
  return (
    <SidebarMenuButton isActive={item.active === true} className={inset ? "pl-8" : undefined}>
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {item.time ?? item.meta}
    </SidebarMenuButton>
  );
}

function DesktopSidebarProjectRow({
  onSelect,
  project,
  renderItem,
}: {
  onSelect?: (projectId: string) => void;
  project: DesktopSidebarProject;
  renderItem?: (item: DesktopSidebarItem, options: { inset: boolean }) => React.ReactNode;
}) {
  return (
    <div>
      <SidebarMenuButton isActive={project.active === true} onClick={() => onSelect?.(project.id)}>
        {project.icon}
        <span className="min-w-0 flex-1 truncate">{project.label}</span>
      </SidebarMenuButton>
      {project.collapsed !== true && project.threads?.map((item) => (
        <div key={item.id}>{renderItem?.(item, { inset: true }) ?? <DesktopSidebarItemRow inset item={item} />}</div>
      ))}
    </div>
  );
}

export type DesktopHomeSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  mark?: React.ReactNode;
  title: React.ReactNode;
};

export function DesktopHomeSurface({ children, className, description, footer, mark, title }: DesktopHomeSurfaceProps) {
  return (
    <section className={cn(
      "opaline-v3-home flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-[var(--color-background-surface)] px-[var(--app-density-chat-gutter-x,0.75rem)] sm:px-[var(--app-density-chat-gutter-x-lg,1.25rem)]",
      className,
    )}>
      <div className="opaline-v3-home-content mx-auto flex w-full max-w-[46rem] min-w-0 flex-col justify-center">
        <header className="opaline-v3-home-heading flex flex-col items-center gap-4 px-6 pb-5 text-center select-none">
          {mark}
          <h2 className="opaline-v3-home-title text-[26px] font-normal leading-[1.15] tracking-[-0.015em] text-foreground/95 sm:text-[30px]">{title}</h2>
          {description != null ? <p className="opaline-v3-home-description max-w-[34rem] text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        </header>
        <div className="opaline-v3-home-primary w-full">{children}</div>
        {footer != null ? <footer className="opaline-v3-home-footer flex justify-center text-xs text-muted-foreground">{footer}</footer> : null}
      </div>
    </section>
  );
}

function resolveSlot(
  slot: React.ReactNode | ((state: DesktopShellState) => React.ReactNode) | undefined,
  state: DesktopShellState,
) {
  return typeof slot === "function" ? slot(state) : slot;
}

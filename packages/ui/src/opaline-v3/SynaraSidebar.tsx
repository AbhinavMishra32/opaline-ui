import { PanelLeft } from "lucide-react";
import * as React from "react";

import { Button } from "../components/button";
import { ScrollArea } from "../components/scroll-area";
import { Separator } from "../components/separator";
import { cn } from "../lib/utils";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_RESIZE_DEFAULT_MIN_WIDTH = 16 * 16;

export const SYNARA_SIDEBAR_OFFCANVAS_MOTION_CLASS =
  "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  state: "expanded" | "collapsed";
  toggleSidebar: () => void;
};

export type SynaraSidebarResizableOptions = {
  maxWidth?: number;
  minWidth?: number;
  onResize?: (width: number) => void;
  storageKey?: string;
};

type ResolvedResizableOptions = {
  maxWidth: number;
  minWidth: number;
  onResize?: (width: number) => void;
  storageKey: string | null;
};

type SidebarInstanceValue = {
  resizable: ResolvedResizableOptions | null;
  side: "left" | "right";
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);
const SidebarInstanceContext = React.createContext<SidebarInstanceValue | null>(null);

export function useSynaraSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSynaraSidebar must be used within SynaraSidebarProvider");
  return context;
}

export function SynaraSidebarProvider({
  children,
  className,
  defaultOpen = true,
  onOpenChange,
  open: controlledOpen,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );
  const toggleSidebar = React.useCallback(() => setOpen(!open), [open, setOpen]);
  const value = React.useMemo(
    () => ({ open, setOpen, state: open ? "expanded" as const : "collapsed" as const, toggleSidebar }),
    [open, setOpen, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        className={cn("group/sidebar-wrapper flex min-h-svh w-full bg-[var(--app-shell-background)]", className)}
        data-sidebar-side="left"
        data-slot="sidebar-wrapper"
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          ...style,
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function resolveResizable(
  resizable: boolean | SynaraSidebarResizableOptions,
): ResolvedResizableOptions | null {
  if (!resizable) return null;
  const options = typeof resizable === "boolean" ? {} : resizable;
  return {
    maxWidth: options.maxWidth ?? Number.POSITIVE_INFINITY,
    minWidth: options.minWidth ?? SIDEBAR_RESIZE_DEFAULT_MIN_WIDTH,
    storageKey: options.storageKey ?? null,
    ...(options.onResize ? { onResize: options.onResize } : {}),
  };
}

export function SynaraSidebarInstanceProvider({
  children,
  resizable,
  side = "left",
}: {
  children: React.ReactNode;
  resizable: boolean | SynaraSidebarResizableOptions;
  side?: "left" | "right";
}) {
  const resolved = React.useMemo(() => resolveResizable(resizable), [resizable]);
  const value = React.useMemo(() => ({ resizable: resolved, side }), [resolved, side]);
  return <SidebarInstanceContext.Provider value={value}>{children}</SidebarInstanceContext.Provider>;
}

export function SynaraSidebar({
  children,
  className,
  gapClassName,
  innerClassName,
  resizable = false,
  side = "left",
  ...props
}: React.ComponentProps<"div"> & {
  gapClassName?: string;
  innerClassName?: string;
  resizable?: boolean | SynaraSidebarResizableOptions;
  side?: "left" | "right";
}) {
  const { state } = useSynaraSidebar();
  const resolved = React.useMemo(() => resolveResizable(resizable), [resizable]);
  const instance = React.useMemo(() => ({ resizable: resolved, side }), [resolved, side]);

  return (
    <SidebarInstanceContext.Provider value={instance}>
      <div
        className="group peer hidden text-sidebar-foreground md:block"
        data-collapsible={state === "collapsed" ? "offcanvas" : ""}
        data-side={side}
        data-slot="sidebar"
        data-state={state}
        data-variant="sidebar"
      >
        <div
          className={cn(
            "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            SYNARA_SIDEBAR_OFFCANVAS_MOTION_CLASS,
            gapClassName,
          )}
          data-slot="sidebar-gap"
        />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-0 hidden h-svh w-(--sidebar-width) transition-[left,width] duration-200 ease-linear md:flex",
            "group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]",
            SYNARA_SIDEBAR_OFFCANVAS_MOTION_CLASS,
            className,
          )}
          data-slot="sidebar-container"
          {...props}
        >
          <div
            className={cn("app-sidebar-surface relative z-0 flex h-full w-full flex-col", innerClassName)}
            data-sidebar="sidebar"
            data-slot="sidebar-inner"
          >
            {children}
          </div>
        </div>
      </div>
    </SidebarInstanceContext.Provider>
  );
}

export function SynaraSidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSynaraSidebar();
  return (
    <Button
      className={cn("size-7", className)}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      size="icon"
      variant="ghost"
      {...props}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function SynaraSidebarHeaderTrigger(props: React.ComponentProps<typeof Button>) {
  const { open } = useSynaraSidebar();
  if (open) return null;
  return <SynaraSidebarTrigger {...props} />;
}

export function SynaraSidebarRail({
  className,
  placement = "sidebar-shell",
  ...props
}: React.ComponentProps<"button"> & { placement?: "sidebar-shell" | "content-seam" }) {
  const { open, toggleSidebar } = useSynaraSidebar();
  const instance = React.useContext(SidebarInstanceContext);
  const resize = instance?.resizable ?? null;
  const side = instance?.side ?? "left";
  const drag = React.useRef<{ pointerId: number; startWidth: number; startX: number; moved: boolean } | null>(null);
  const canResize = resize !== null && open;

  function finish(event: React.PointerEvent<HTMLButtonElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }

  return (
    <button
      aria-label={canResize ? "Resize Sidebar" : "Toggle Sidebar"}
      className={cn(
        placement === "content-seam"
          ? "absolute inset-y-0 left-0 z-[25] hidden w-4 -translate-x-1/2 sm:flex"
          : "absolute inset-y-0 -right-2 z-20 hidden w-4 sm:flex",
        canResize ? "cursor-col-resize" : "cursor-pointer",
        className,
      )}
      data-placement={placement}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={(event) => {
        if (drag.current?.moved || canResize) {
          event.preventDefault();
          return;
        }
        toggleSidebar();
      }}
      onPointerDown={(event) => {
        if (!canResize || event.button !== 0) return;
        const wrapper = event.currentTarget.closest<HTMLElement>("[data-slot='sidebar-wrapper']");
        if (!wrapper) return;
        const startWidth = Number.parseFloat(getComputedStyle(wrapper).getPropertyValue("--sidebar-width"));
        drag.current = { pointerId: event.pointerId, startWidth, startX: event.clientX, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }}
      onPointerMove={(event) => {
        const state = drag.current;
        if (!state || state.pointerId !== event.pointerId || !resize) return;
        const wrapper = event.currentTarget.closest<HTMLElement>("[data-slot='sidebar-wrapper']");
        if (!wrapper) return;
        const delta = side === "left" ? event.clientX - state.startX : state.startX - event.clientX;
        state.moved ||= Math.abs(delta) > 2;
        const width = Math.max(resize.minWidth, Math.min(resize.maxWidth, state.startWidth + delta));
        wrapper.style.setProperty("--sidebar-width", `${width}px`);
        resize.onResize?.(width);
        if (resize.storageKey) window.localStorage.setItem(resize.storageKey, String(width));
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      tabIndex={-1}
      type="button"
      {...props}
    />
  );
}

export function SynaraSidebarInset({
  children,
  className,
  surfaceClassName,
  ...props
}: React.ComponentProps<"main"> & { surfaceClassName?: string }) {
  return (
    <main
      className={cn("relative flex min-h-0 min-w-0 w-full flex-1 flex-col bg-transparent", className)}
      data-slot="sidebar-inset"
      {...props}
    >
      <div
        className={cn("flex min-h-0 min-w-0 flex-1 flex-col text-inherit", surfaceClassName ?? "bg-background")}
        data-slot="sidebar-inset-surface"
      >
        {children}
      </div>
    </main>
  );
}

export function SynaraSidebarHeader(props: React.ComponentProps<"div">) {
  return <div data-sidebar="header" data-slot="sidebar-header" {...props} />;
}

export function SynaraSidebarContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <ScrollArea className="h-auto min-h-0 flex-1">
      <div
        className={cn("flex w-full min-w-0 flex-col gap-0", className)}
        data-sidebar="content"
        data-slot="sidebar-content"
        {...props}
      >
        {children}
      </div>
    </ScrollArea>
  );
}

export function SynaraSidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-2", className)} data-sidebar="footer" data-slot="sidebar-footer" {...props} />;
}

export function SynaraSidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative flex w-full min-w-0 flex-col px-1.5 py-1.5", className)} data-sidebar="group" data-slot="sidebar-group" {...props} />;
}

export function SynaraSidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex h-7 shrink-0 items-center px-2 text-[length:var(--app-font-size-ui,12px)] font-normal text-muted-foreground/58", className)} data-sidebar="group-label" data-slot="sidebar-group-label" {...props} />;
}

export function SynaraSidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex w-full min-w-0 flex-col gap-0.5", className)} data-sidebar="menu" data-slot="sidebar-menu" {...props} />;
}

export function SynaraSidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("group/menu-item relative", className)} data-sidebar="menu-item" data-slot="sidebar-menu-item" {...props} />;
}

export function SynaraSidebarMenuButton({
  active = false,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "flex h-[var(--app-density-row-height,1.75rem)] w-full min-w-0 cursor-pointer items-center gap-[var(--app-density-row-gap,0.5rem)] overflow-hidden rounded-md px-2 py-[var(--app-density-row-padding-y,0.125rem)] text-left text-[length:var(--app-font-size-ui,12px)] font-normal text-foreground/89 outline-hidden transition-colors hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        active && "bg-[var(--sidebar-accent-active)] text-[var(--sidebar-accent-foreground)]",
        className,
      )}
      data-active={active ? "true" : undefined}
      data-sidebar="menu-button"
      data-slot="sidebar-menu-button"
      type="button"
      {...props}
    />
  );
}

export function SynaraSidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator className={cn("mx-2 w-auto bg-sidebar-border", className)} data-sidebar="separator" data-slot="sidebar-separator" {...props} />;
}

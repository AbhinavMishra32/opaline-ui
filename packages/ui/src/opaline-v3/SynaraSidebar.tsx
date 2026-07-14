import * as React from "react";

import { Button } from "../components/button";
import { Input } from "../components/input";
import { ScrollArea } from "../components/scroll-area";
import { Separator } from "../components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/sheet";
import { cn } from "../lib/utils";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "calc(100vw - 0.75rem)";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_RESIZE_DEFAULT_MIN_WIDTH = 16 * 16;

export const SYNARA_SIDEBAR_OFFCANVAS_MOTION_CLASS =
  "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

type SidebarContextValue = {
  isMobile: boolean;
  open: boolean;
  openMobile: boolean;
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  state: "expanded" | "collapsed";
  toggleSidebar: () => void;
};

export type SynaraSidebarResizableOptions = {
  maxWidth?: number;
  minWidth?: number;
  onResize?: (width: number) => void;
  shouldAcceptWidth?: (context: {
    currentWidth: number;
    nextWidth: number;
    rail: HTMLButtonElement;
    side: "left" | "right";
    sidebarRoot: HTMLElement;
    wrapper: HTMLElement;
  }) => boolean;
  storageKey?: string;
};

type ResolvedResizableOptions = {
  maxWidth: number;
  minWidth: number;
  onResize?: (width: number) => void;
  shouldAcceptWidth?: SynaraSidebarResizableOptions["shouldAcceptWidth"];
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
  const [openMobile, setOpenMobile] = React.useState(false);
  const isMobile = useSynaraMobileBreakpoint();
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );
  const toggleSidebar = React.useCallback(
    () => isMobile ? setOpenMobile((current) => !current) : setOpen(!open),
    [isMobile, open, setOpen],
  );
  const value = React.useMemo(
    () => ({
      isMobile,
      open,
      openMobile,
      setOpen,
      setOpenMobile,
      state: open ? "expanded" as const : "collapsed" as const,
      toggleSidebar,
    }),
    [isMobile, open, openMobile, setOpen, toggleSidebar],
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

function useSynaraMobileBreakpoint() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
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
    ...(options.shouldAcceptWidth ? { shouldAcceptWidth: options.shouldAcceptWidth } : {}),
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
  const { isMobile } = useSynaraSidebar();
  const resolved = React.useMemo(() => isMobile ? null : resolveResizable(resizable), [isMobile, resizable]);
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
  const { isMobile, openMobile, setOpenMobile, state } = useSynaraSidebar();
  const resolved = React.useMemo(() => isMobile ? null : resolveResizable(resizable), [isMobile, resizable]);
  const instance = React.useMemo(() => ({ resizable: resolved, side }), [resolved, side]);

  if (isMobile) {
    return (
      <SidebarInstanceContext.Provider value={instance}>
        <Sheet onOpenChange={setOpenMobile} open={openMobile}>
          <SheetContent
            className={cn("w-(--sidebar-width) max-w-none bg-sidebar p-0 text-sidebar-foreground", className)}
            data-mobile="true"
            data-sidebar="sidebar"
            data-slot="sidebar"
            showCloseButton={false}
            side={side}
            style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Sidebar</SheetTitle>
              <SheetDescription>Displays the navigation sidebar.</SheetDescription>
            </SheetHeader>
            <div className={cn("flex h-full w-full flex-col", innerClassName)}>{children}</div>
          </SheetContent>
        </Sheet>
      </SidebarInstanceContext.Provider>
    );
  }

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
      <SynaraSidebarToggleIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SynaraSidebarToggleIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M2.75 6.75C2.75 5.64543 3.64543 4.75 4.75 4.75H19.25C20.3546 4.75 21.25 5.64543 21.25 6.75V17.25C21.25 18.3546 20.3546 19.25 19.25 19.25H4.75C3.64543 19.25 2.75 18.3546 2.75 17.25V6.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M6.25 8.25V15.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function SynaraSidebarHeaderTrigger(props: React.ComponentProps<typeof Button>) {
  const { isMobile, open } = useSynaraSidebar();
  if (!isMobile && open) return null;
  return <SynaraSidebarTrigger {...props} />;
}

export function SynaraSidebarRail({
  className,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  placement = "sidebar-shell",
  ...props
}: React.ComponentProps<"button"> & { placement?: "sidebar-shell" | "content-seam" }) {
  const { open, toggleSidebar } = useSynaraSidebar();
  const instance = React.useContext(SidebarInstanceContext);
  const resize = instance?.resizable ?? null;
  const side = instance?.side ?? "left";
  const railRef = React.useRef<HTMLButtonElement | null>(null);
  const suppressClick = React.useRef(false);
  const drag = React.useRef<{
    moved: boolean;
    pendingWidth: number;
    pointerId: number;
    rafId: number | null;
    rail: HTMLButtonElement;
    sidebarRoot: HTMLElement;
    startWidth: number;
    startX: number;
    transitionTargets: HTMLElement[];
    width: number;
    wrapper: HTMLElement;
  } | null>(null);
  const canResize = resize !== null && open;

  const finish = React.useCallback((pointerId: number) => {
    const state = drag.current;
    if (!state) return;
    if (state.rafId !== null) window.cancelAnimationFrame(state.rafId);
    state.transitionTargets.forEach((target) => target.style.removeProperty("transition-duration"));
    if (resize?.storageKey) window.localStorage.setItem(resize.storageKey, String(state.width));
    resize?.onResize?.(state.width);
    drag.current = null;
    if (state.rail.hasPointerCapture(pointerId)) state.rail.releasePointerCapture(pointerId);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }, [resize]);

  React.useEffect(() => {
    if (!resize?.storageKey) return;
    const rail = railRef.current;
    const wrapper = rail?.closest<HTMLElement>("[data-slot='sidebar-wrapper']");
    if (!wrapper) return;
    const stored = Number.parseFloat(window.localStorage.getItem(resize.storageKey) ?? "");
    if (!Number.isFinite(stored)) return;
    const width = Math.max(resize.minWidth, Math.min(resize.maxWidth, stored));
    wrapper.style.setProperty("--sidebar-width", `${width}px`);
    resize.onResize?.(width);
  }, [resize]);

  React.useEffect(() => () => {
    const state = drag.current;
    if (state?.rafId != null) window.cancelAnimationFrame(state.rafId);
    state?.transitionTargets.forEach((target) => target.style.removeProperty("transition-duration"));
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }, []);

  return (
    <button
      aria-label={canResize ? "Resize Sidebar" : "Toggle Sidebar"}
      className={cn(
        placement === "content-seam"
          ? cn(
              "absolute inset-y-0 z-[25] hidden w-4 sm:flex",
              side === "left" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
            )
          : "absolute inset-y-0 -right-2 z-20 hidden w-4 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:bg-transparent after:transition-colors hover:after:bg-sidebar-border sm:flex",
        canResize ? "cursor-col-resize" : "cursor-pointer",
        className,
      )}
      data-placement={placement}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (suppressClick.current) {
          suppressClick.current = false;
          event.preventDefault();
          return;
        }
        if (canResize) {
          event.preventDefault();
          return;
        }
        toggleSidebar();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented) return;
        if (!canResize || event.button !== 0) return;
        const wrapper = event.currentTarget.closest<HTMLElement>("[data-slot='sidebar-wrapper']");
        const sidebarRoot = wrapper?.querySelector<HTMLElement>("[data-slot='sidebar']");
        const container = sidebarRoot?.querySelector<HTMLElement>("[data-slot='sidebar-container']");
        if (!wrapper || !sidebarRoot || !container || !resize) return;
        const startWidth = Math.max(resize.minWidth, Math.min(resize.maxWidth, container.getBoundingClientRect().width));
        const transitionTargets = [
          sidebarRoot.querySelector<HTMLElement>("[data-slot='sidebar-gap']"),
          container,
        ].filter((target): target is HTMLElement => target !== null);
        transitionTargets.forEach((target) => target.style.setProperty("transition-duration", "0ms"));
        event.preventDefault();
        event.stopPropagation();
        drag.current = {
          moved: false,
          pendingWidth: startWidth,
          pointerId: event.pointerId,
          rafId: null,
          rail: event.currentTarget,
          sidebarRoot,
          startWidth,
          startX: event.clientX,
          transitionTargets,
          width: startWidth,
          wrapper,
        };
        wrapper.style.setProperty("--sidebar-width", `${startWidth}px`);
        event.currentTarget.setPointerCapture(event.pointerId);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (event.defaultPrevented) return;
        const state = drag.current;
        if (!state || state.pointerId !== event.pointerId || !resize) return;
        event.preventDefault();
        const delta = side === "left" ? event.clientX - state.startX : state.startX - event.clientX;
        state.moved ||= Math.abs(delta) > 2;
        state.pendingWidth = Math.max(resize.minWidth, Math.min(resize.maxWidth, state.startWidth + delta));
        if (state.rafId !== null) return;
        state.rafId = window.requestAnimationFrame(() => {
          const active = drag.current;
          if (!active || !resize) return;
          active.rafId = null;
          const accepted = resize.shouldAcceptWidth?.({
            currentWidth: active.width,
            nextWidth: active.pendingWidth,
            rail: active.rail,
            side,
            sidebarRoot: active.sidebarRoot,
            wrapper: active.wrapper,
          }) ?? true;
          if (!accepted) return;
          active.wrapper.style.setProperty("--sidebar-width", `${active.pendingWidth}px`);
          active.width = active.pendingWidth;
        });
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (event.defaultPrevented || drag.current?.pointerId !== event.pointerId) return;
        event.preventDefault();
        suppressClick.current = drag.current.moved;
        finish(event.pointerId);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (event.defaultPrevented || drag.current?.pointerId !== event.pointerId) return;
        event.preventDefault();
        suppressClick.current = drag.current.moved;
        finish(event.pointerId);
      }}
      ref={railRef}
      tabIndex={-1}
      title={canResize ? "Drag to resize sidebar" : "Toggle Sidebar"}
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
  const { className, ...rest } = props;
  return <div className={cn("flex flex-col gap-2 p-2", className)} data-sidebar="header" data-slot="sidebar-header" {...rest} />;
}

export function SynaraSidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn("h-8 w-full bg-background shadow-none", className)}
      data-sidebar="input"
      data-slot="sidebar-input"
      {...props}
    />
  );
}

export function SynaraSidebarContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <ScrollArea hideScrollbars scrollFade className="h-auto min-h-0 flex-1">
      <div
        className={cn(
          "flex w-full min-w-0 flex-col gap-2 group-data-[collapsible=icon]:overflow-hidden",
          className,
        )}
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
  return <div className={cn("relative flex w-full min-w-0 flex-col p-2", className)} data-sidebar="group" data-slot="sidebar-group" {...props} />;
}

export function SynaraSidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(
    "flex h-8 shrink-0 items-center rounded-lg px-2 text-xs font-medium text-sidebar-foreground outline-hidden ring-ring/60 transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-1 [&>svg]:size-4 [&>svg]:shrink-0",
    "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
    className,
  )} data-sidebar="group-label" data-slot="sidebar-group-label" {...props} />;
}

export function SynaraSidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex w-full min-w-0 flex-col gap-1", className)} data-sidebar="menu" data-slot="sidebar-menu" {...props} />;
}

export function SynaraSidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("group/menu-item relative", className)} data-sidebar="menu-item" data-slot="sidebar-menu-item" {...props} />;
}

export function SynaraSidebarMenuAction({
  className,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & { showOnHover?: boolean }) {
  return (
    <button
      className={cn(
        "sidebar-icon-button absolute right-1 top-1.5 flex aspect-square w-5 cursor-pointer p-0 text-sidebar-foreground outline-hidden ring-ring/60 transition-transform after:absolute after:-inset-2 focus-visible:ring-1 peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-[var(--sidebar-accent-foreground)] md:opacity-0",
        className,
      )}
      data-sidebar="menu-action"
      data-slot="sidebar-menu-action"
      type="button"
      {...props}
    />
  );
}

export function SynaraSidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-1 top-1.5 flex h-5 min-w-5 select-none items-center justify-center rounded-lg px-1 text-xs font-medium tabular-nums text-sidebar-foreground peer-data-[active=true]/menu-button:text-[var(--sidebar-accent-foreground)] peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-badge"
      data-slot="sidebar-menu-badge"
      {...props}
    />
  );
}

export function SynaraSidebarMenuButton({
  active = false,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"button"> & {
  active?: boolean;
  size?: "default" | "lg" | "sm";
  variant?: "default" | "outline";
}) {
  return (
    <button
      className={cn(
        "peer/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-xl p-2 text-left outline-hidden ring-ring/60 transition-[width,height,padding] hover:bg-[var(--sidebar-accent)] focus-visible:ring-1 active:bg-[var(--sidebar-accent-active)] active:text-[var(--sidebar-accent-foreground)] disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pe-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[var(--sidebar-accent-active)] data-[active=true]:font-medium data-[active=true]:text-[var(--sidebar-accent-foreground)] data-[state=open]:hover:bg-[var(--sidebar-accent)] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0",
        size === "default" && "h-8 text-sm",
        size === "sm" && "h-7 text-xs",
        size === "lg" && "h-12 text-sm group-data-[collapsible=icon]:p-0!",
        variant === "outline" && "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-[var(--sidebar-accent)] hover:shadow-[0_0_0_1px_var(--sidebar-border)]",
        className,
      )}
      data-active={active ? "true" : undefined}
      data-sidebar="menu-button"
      data-size={size}
      data-slot="sidebar-menu-button"
      type="button"
      {...props}
    />
  );
}

export function SynaraSidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator className={cn("mx-2 w-auto bg-sidebar-border", className)} data-sidebar="separator" data-slot="sidebar-separator" {...props} />;
}

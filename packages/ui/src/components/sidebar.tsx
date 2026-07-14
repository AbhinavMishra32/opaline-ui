import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "../lib/utils";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "calc(100vw - 0.75rem)";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_RESIZE_DEFAULT_MIN_WIDTH = 16 * 16;

export const SIDEBAR_OFFCANVAS_MOTION_CLASS =
  "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";
export const SIDEBAR_OFFCANVAS_MOTION_SUPPRESSED_CLASS =
  "transition-none! duration-0!";

type SidebarContextValue = {
  isMobile: boolean;
  open: boolean;
  openMobile: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  setOpenMobile: (open: boolean) => void;
  state: "expanded" | "collapsed";
  toggleSidebar: () => void;
};

export type SidebarResizableOptions = {
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
  shouldAcceptWidth?: SidebarResizableOptions["shouldAcceptWidth"];
  storageKey: string | null;
};

type SidebarInstanceValue = {
  resizable: ResolvedResizableOptions | null;
  side: "left" | "right";
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);
const SidebarInstanceContext = React.createContext<SidebarInstanceValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}

export function SidebarProvider({
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
  const isMobile = useMobileBreakpoint();
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      const resolved = typeof next === "function" ? next(open) : next;
      if (controlledOpen === undefined) setInternalOpen(resolved);
      onOpenChange?.(resolved);
    },
    [controlledOpen, onOpenChange],
  );
  const toggleSidebar = React.useCallback(
    () => isMobile ? setOpenMobile((current) => !current) : setOpen((current) => !current),
    [isMobile, setOpen],
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
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          className,
        )}
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

function useMobileBreakpoint() {
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
  resizable: boolean | SidebarResizableOptions,
  { collapsible, isMobile }: { collapsible: "offcanvas" | "icon" | "none"; isMobile: boolean },
): ResolvedResizableOptions | null {
  if (isMobile || collapsible === "none" || !resizable) return null;
  const options = typeof resizable === "boolean" ? {} : resizable;
  return {
    maxWidth: options.maxWidth ?? Number.POSITIVE_INFINITY,
    minWidth: options.minWidth ?? SIDEBAR_RESIZE_DEFAULT_MIN_WIDTH,
    storageKey: options.storageKey ?? null,
    ...(options.onResize ? { onResize: options.onResize } : {}),
    ...(options.shouldAcceptWidth ? { shouldAcceptWidth: options.shouldAcceptWidth } : {}),
  };
}

export function SidebarInstanceProvider({
  children,
  collapsible = "offcanvas",
  resizable,
  side = "left",
}: {
  children: React.ReactNode;
  collapsible?: "offcanvas" | "icon" | "none";
  resizable: boolean | SidebarResizableOptions;
  side?: "left" | "right";
}) {
  const { isMobile } = useSidebar();
  const resolved = React.useMemo(
    () => resolveResizable(resizable, { collapsible, isMobile }),
    [collapsible, isMobile, resizable],
  );
  const value = React.useMemo(() => ({ resizable: resolved, side }), [resolved, side]);
  return <SidebarInstanceContext.Provider value={value}>{children}</SidebarInstanceContext.Provider>;
}

export function Sidebar({
  children,
  className,
  collapsible = "offcanvas",
  gapClassName,
  innerClassName,
  resizable = false,
  side = "left",
  transparentSurface = false,
  variant = "sidebar",
  ...props
}: React.ComponentProps<"div"> & {
  collapsible?: "offcanvas" | "icon" | "none";
  gapClassName?: string;
  innerClassName?: string;
  resizable?: boolean | SidebarResizableOptions;
  side?: "left" | "right";
  transparentSurface?: boolean;
  variant?: "sidebar" | "floating" | "inset";
}) {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();
  const resolved = React.useMemo(
    () => resolveResizable(resizable, { collapsible, isMobile }),
    [collapsible, isMobile, resizable],
  );
  const instance = React.useMemo(() => ({ resizable: resolved, side }), [resolved, side]);

  if (collapsible === "none") {
    return (
      <SidebarInstanceContext.Provider value={instance}>
        <div
          className={cn(
            "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
            innerClassName,
            className,
          )}
          data-slot="sidebar"
          {...props}
        >
          {children}
        </div>
      </SidebarInstanceContext.Provider>
    );
  }

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
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-side={side}
        data-slot="sidebar"
        data-state={state}
        data-variant={variant}
      >
        <div
          className={cn(
            "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
            gapClassName,
          )}
          data-slot="sidebar-gap"
        />
        <div
          className={cn(
            "fixed inset-y-0 z-0 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
              : cn(
                  "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
                  !transparentSurface &&
                    "group-data-[side=left]:border-r group-data-[side=right]:border-l",
                ),
            className,
          )}
          data-slot="sidebar-container"
          {...props}
        >
          <div
            className={cn(
              "relative z-0 flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm/5",
              !transparentSurface && "bg-sidebar",
              innerClassName,
            )}
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

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      className={cn("size-7", className)}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      size="icon-xs"
      variant="ghost"
      {...props}
    >
      <SidebarToggleIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarToggleIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M2.75 6.75C2.75 5.64543 3.64543 4.75 4.75 4.75H19.25C20.3546 4.75 21.25 5.64543 21.25 6.75V17.25C21.25 18.3546 20.3546 19.25 19.25 19.25H4.75C3.64543 19.25 2.75 18.3546 2.75 17.25V6.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M6.25 8.25V15.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function SidebarHeaderTrigger(props: React.ComponentProps<typeof Button>) {
  const { isMobile, open } = useSidebar();
  if (!isMobile && open) return null;
  return <SidebarTrigger {...props} />;
}

export function SidebarRail({
  className,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  placement = "sidebar-shell",
  ...props
}: React.ComponentProps<"button"> & { placement?: "sidebar-shell" | "content-seam" }) {
  const { open, toggleSidebar } = useSidebar();
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
          ? [
              "absolute inset-y-0 z-[25] hidden w-4 sm:flex",
              canResize ? "cursor-col-resize" : "cursor-pointer",
              side === "left" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
            ]
          : [
              "-translate-x-1/2 group-data-[side=left]:-right-4 absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:bg-transparent after:transition-colors hover:after:bg-sidebar-border group-data-[side=right]:left-0 sm:flex [[data-collapsible=offcanvas][data-state=collapsed]_&]:pointer-events-none",
              "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
              "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
              "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
              "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
              "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
            ],
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

export function SidebarInset({
  children,
  className,
  surfaceClassName,
  ...props
}: React.ComponentProps<"main"> & { surfaceClassName?: string }) {
  return (
    <main
      className={cn(
        "relative flex min-h-0 min-w-0 w-full flex-1 flex-col bg-transparent",
        "md:peer-data-[variant=sidebar]:peer-data-[side=left]:peer-data-[state=expanded]:-ms-[var(--sidebar-width)]",
        "md:peer-data-[variant=sidebar]:peer-data-[side=left]:peer-data-[state=expanded]:w-[calc(100%+var(--sidebar-width))]",
        "md:peer-data-[variant=sidebar]:peer-data-[side=left]:peer-data-[state=expanded]:ps-[var(--sidebar-width)]",
        "md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-2 md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ms-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm/5",
        className,
      )}
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

export function SidebarHeader(props: React.ComponentProps<"div">) {
  const { className, ...rest } = props;
  return <div className={cn("flex flex-col gap-2 p-2", className)} data-sidebar="header" data-slot="sidebar-header" {...rest} />;
}

export function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn("h-8 w-full bg-background shadow-none", className)}
      data-sidebar="input"
      data-slot="sidebar-input"
      {...props}
    />
  );
}

export function SidebarContent({ className, children, ...props }: React.ComponentProps<"div">) {
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

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-2", className)} data-sidebar="footer" data-slot="sidebar-footer" {...props} />;
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative flex w-full min-w-0 flex-col p-2", className)} data-sidebar="group" data-slot="sidebar-group" {...props} />;
}

export function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    className: cn(
      "flex h-8 shrink-0 items-center rounded-lg px-2 font-medium text-sidebar-foreground text-xs outline-hidden ring-ring/60 transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-1 [&>svg]:size-4 [&>svg]:shrink-0",
      "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
      className,
    ),
    "data-sidebar": "group-label",
    "data-slot": "sidebar-group-label",
  };

  return useRender({
    defaultTagName: "div",
    props: mergeProps(defaultProps, props),
    render,
  });
}

export function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button">) {
  const defaultProps = {
    className: cn(
      "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-lg p-0 text-sidebar-foreground outline-hidden ring-ring/60 transition-transform hover:bg-[var(--sidebar-accent)] focus-visible:ring-1 [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0",
      "after:-inset-2 after:absolute md:after:hidden",
      "group-data-[collapsible=icon]:hidden",
      className,
    ),
    "data-sidebar": "group-action",
    "data-slot": "sidebar-group-action",
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps(defaultProps, props),
    render,
  });
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full text-sm", className)}
      data-sidebar="group-content"
      data-slot="sidebar-group-content"
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      data-sidebar="menu"
      data-slot="sidebar-menu"
      {...props}
    />
  );
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-item relative", className)}
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-xl p-2 text-left text-sm outline-hidden ring-ring/60 transition-[width,height,padding] hover:bg-[var(--sidebar-accent)] focus-visible:ring-1 active:bg-[var(--sidebar-accent-active)] active:text-[var(--sidebar-accent-foreground)] disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pe-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[var(--sidebar-accent-active)] data-[active=true]:font-medium data-[active=true]:text-[var(--sidebar-accent-foreground)] data-[state=open]:hover:bg-[var(--sidebar-accent)] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-8 text-sm",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
        sm: "h-7 text-xs",
      },
      variant: {
        default: "hover:bg-[var(--sidebar-accent)]",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-[var(--sidebar-accent)] hover:shadow-[0_0_0_1px_var(--sidebar-border)]",
      },
    },
  },
);

export function SidebarMenuButton({
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & {
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();

  const defaultProps = {
    className: cn(sidebarMenuButtonVariants({ size, variant }), className),
    "data-active": isActive,
    "data-sidebar": "menu-button",
    "data-size": size,
    "data-slot": "sidebar-menu-button",
  };

  const buttonElement = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });

  if (!tooltip) return buttonElement;

  const tooltipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip;
  return (
    <Tooltip>
      <TooltipTrigger render={buttonElement as React.ReactElement<Record<string, unknown>>} />
      <TooltipContent
        align="center"
        hidden={state !== "collapsed" || isMobile}
        side="right"
        {...tooltipProps}
      />
    </Tooltip>
  );
}

export function SidebarMenuAction({
  className,
  showOnHover = false,
  render,
  ...props
}: useRender.ComponentProps<"button"> & { showOnHover?: boolean }) {
  const defaultProps = {
    className: cn(
      "sidebar-icon-button absolute top-1.5 right-1 flex aspect-square w-5 cursor-pointer p-0 text-sidebar-foreground outline-hidden ring-ring/60 transition-transform [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0",
      "after:-inset-2 after:absolute md:after:hidden",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      showOnHover &&
        "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-[var(--sidebar-accent-foreground)] md:opacity-0",
      className,
    ),
    "data-sidebar": "menu-action",
    "data-slot": "sidebar-menu-action",
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-lg px-1 font-medium text-sidebar-foreground text-xs tabular-nums",
        "peer-data-[active=true]/menu-button:text-[var(--sidebar-accent-foreground)]",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-badge"
      data-slot="sidebar-menu-badge"
      {...props}
    />
  );
}

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & { showIcon?: boolean }) {
  const width = React.useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);
  return (
    <div
      className={cn("flex h-8 items-center gap-2 rounded-lg px-2", className)}
      data-sidebar="menu-skeleton"
      data-slot="sidebar-menu-skeleton"
      {...props}
    >
      {showIcon ? <Skeleton className="size-4 rounded-lg" data-sidebar="menu-skeleton-icon" /> : null}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={{ "--skeleton-width": width } as React.CSSProperties}
      />
    </div>
  );
}

export function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-sidebar-border border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="menu-sub"
      data-slot="sidebar-menu-sub"
      {...props}
    />
  );
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-sub-item relative", className)}
      data-sidebar="menu-sub-item"
      data-slot="sidebar-menu-sub-item"
      {...props}
    />
  );
}

export function SidebarMenuSubButton({
  size = "md",
  isActive = false,
  className,
  render,
  ...props
}: useRender.ComponentProps<"a"> & { size?: "sm" | "md"; isActive?: boolean }) {
  const defaultProps = {
    className: cn(
      "-translate-x-px flex h-7 min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-lg px-2 text-sidebar-foreground outline-hidden ring-ring/60 hover:bg-[var(--sidebar-accent)] focus-visible:ring-1 active:bg-[var(--sidebar-accent-active)] active:text-[var(--sidebar-accent-foreground)] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg:not([class*='size-'])]:size-4 [&>svg]:shrink-0",
      "data-[active=true]:bg-[var(--sidebar-accent-active)] data-[active=true]:text-[var(--sidebar-accent-foreground)]",
      size === "sm" && "text-xs",
      size === "md" && "text-sm",
      "group-data-[collapsible=icon]:hidden",
      className,
    ),
    "data-active": isActive,
    "data-sidebar": "menu-sub-button",
    "data-size": size,
    "data-slot": "sidebar-menu-sub-button",
  };

  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  });
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      data-sidebar="separator"
      data-slot="sidebar-separator"
      {...props}
    />
  );
}

import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useRef, useState } from "react";
import { Button } from "#components/button";
import { ScrollArea } from "#components/scroll-area";
import { Separator } from "#components/separator";
import { cn } from "#lib/utils";
import { appActionAttributes } from "../sidebar/appActionAttributes";

export type SidebarItem = {
  active?: boolean;
  hostId?: string | null;
  id: string;
  label?: string;
  kind?: "local" | "remote";
  meta?: ReactNode;
  pinned?: boolean;
  time?: ReactNode;
  title: ReactNode;
};

export type SidebarProject = {
  active?: boolean;
  collapsed?: boolean;
  icon?: ReactNode;
  id: string;
  label: ReactNode;
  labelForAttributes?: string;
  muted?: boolean;
  threads?: SidebarItem[];
};

export type SidebarNavItem = {
  active?: boolean;
  icon?: ReactNode;
  id: string;
  label: ReactNode;
  onClick?: () => void;
  badge?: ReactNode;
};

export type SidebarProps = {
  children?: ReactNode;
  className?: string;
  footer?: ReactNode;
  items?: SidebarItem[];
  onProjectSelect?: (projectId: string) => void;
  primaryItems?: SidebarNavItem[];
  projects?: SidebarProject[];
  renderItem?: (item: SidebarItem, options: { inset: boolean }) => ReactNode;
  renderNavItem?: (item: SidebarNavItem) => ReactNode;
  renderProject?: (project: SidebarProject) => ReactNode;
  sectionLabels?: { items?: string; projects?: string };
};

export function Sidebar({
  children,
  className,
  footer,
  items = [],
  onProjectSelect,
  primaryItems = [],
  projects = [],
  renderItem,
  renderNavItem,
  renderProject,
  sectionLabels = { items: "Items", projects: "Projects" },
}: SidebarProps) {
  return (
    <aside className={cn("flex h-full min-h-0 flex-col bg-transparent text-sidebar-foreground", className)}>
      {primaryItems.length > 0 ? (
        <SidebarPrimary>
          {primaryItems.map((item) => renderNavItem?.(item) ?? <SidebarNavItemRow item={item} key={item.id} />)}
        </SidebarPrimary>
      ) : null}
      <SidebarScroll>
        {projects.length > 0 ? (
          <SidebarSection heading={sectionLabels.projects ?? "Projects"}>
            {projects.map((project) =>
              renderProject?.(project) ?? (
                <SidebarProjectRow key={project.id} project={project} renderItem={renderItem} onSelect={onProjectSelect} />
              ),
            )}
          </SidebarSection>
        ) : null}
        {items.length > 0 ? (
          <SidebarSection heading={sectionLabels.items ?? "Items"}>
            <nav className="flex flex-col gap-0.5" aria-label={sectionLabels.items ?? "Items"}>
              {items.map((item) => renderItem?.(item, { inset: false }) ?? <SidebarThreadRow key={item.id} item={item} />)}
            </nav>
          </SidebarSection>
        ) : null}
        {children}
      </SidebarScroll>
      {footer != null ? (
        <>
          <Separator />
          <SidebarFooter>{footer}</SidebarFooter>
        </>
      ) : null}
    </aside>
  );
}

export function SidebarPrimary({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <nav className={cn("flex flex-col gap-0.5 px-1.5 pb-1.5 pt-1", className)} aria-label="Primary" {...props}>{children}</nav>;
}

export function SidebarScroll({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <ScrollArea className={cn("min-h-0 flex-1", className)} {...appActionAttributes.sidebarScroll} {...props}>
      <div className="flex flex-col gap-0.5 px-1.5 py-1.5">{children}</div>
    </ScrollArea>
  );
}

export function SidebarFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 p-2", className)} {...props}>{children}</div>;
}

export type SidebarBottomSlotProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  defaultHeight?: number;
  header: ReactNode;
  maxHeight?: number;
  minHeight?: number;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function SidebarBottomSlot({
  children,
  className,
  collapsed,
  defaultCollapsed = false,
  defaultHeight = 220,
  header,
  maxHeight = 520,
  minHeight = 120,
  onCollapsedChange,
  style,
  ...props
}: SidebarBottomSlotProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const [height, setHeight] = useState(defaultHeight);
  const rootRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startHeight: number; startY: number } | null>(null);
  const isCollapsed = collapsed ?? internalCollapsed;

  function setCollapsed(next: boolean) {
    if (collapsed === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  }

  function beginResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (isCollapsed) return;
    event.preventDefault();
    dragRef.current = { pointerId: event.pointerId, startHeight: height, startY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextHeight = Math.max(minHeight, Math.min(maxHeight, drag.startHeight + drag.startY - event.clientY));
    rootRef.current?.style.setProperty("--opaline-v2-sidebar-slot-height", `${nextHeight}px`);
  }

  function endResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const drag = dragRef.current;
    const nextHeight = Math.max(minHeight, Math.min(maxHeight, drag.startHeight + drag.startY - event.clientY));
    dragRef.current = null;
    setHeight(nextHeight);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section
      ref={rootRef}
      className={cn("relative flex min-h-0 flex-col border-t bg-transparent", isCollapsed ? "h-auto" : "h-[var(--opaline-v2-sidebar-slot-height)]", className)}
      data-collapsed={isCollapsed ? "true" : "false"}
      style={{ ...style, "--opaline-v2-sidebar-slot-height": `${height}px` } as CSSProperties}
      {...props}
    >
      <div className={cn("absolute inset-x-0 -top-1 h-2 cursor-row-resize touch-none", isCollapsed && "pointer-events-none")} onPointerDown={beginResize} onPointerMove={resize} onPointerCancel={endResize} onPointerUp={endResize} />
      <Button className="h-8 w-full justify-start rounded-[7px] px-2" variant="ghost" onClick={() => setCollapsed(!isCollapsed)}>
        {header}
      </Button>
      <div className={cn("min-h-0 flex-1 overflow-hidden", isCollapsed && "hidden")}>{children}</div>
    </section>
  );
}

export function SidebarNavItemRow({ className, item, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { item: SidebarNavItem }) {
  return (
    <Button
      className={cn("construct-sidebar-row", className)}
      data-active={item.active === true ? "true" : undefined}
      onClick={item.onClick}
      type={type}
      variant="ghost"
      {...props}
    >
      {item.icon != null ? <span className="grid size-[18px] shrink-0 place-items-center" data-icon="inline-start" aria-hidden="true">{item.icon}</span> : null}
      <span className="flex-1 text-left" data-sidebar-row-label>{item.label}</span>
      {item.badge}
    </Button>
  );
}

export function SidebarSection({ children, heading }: { children: ReactNode; heading: string }) {
  return (
    <section className="flex flex-col gap-1" {...appActionAttributes.sidebarSection({ collapsed: false, heading })}>
      <div className="px-2 py-1 text-[length:var(--app-font-size-ui,12px)] font-normal text-muted-foreground/58">{heading}</div>
      {children}
    </section>
  );
}

export function SidebarProjectRow({ onSelect, project, renderItem }: { onSelect?: (projectId: string) => void; project: SidebarProject; renderItem?: (item: SidebarItem, options: { inset: boolean }) => ReactNode }) {
  const label = typeof project.label === "string" ? project.label : project.labelForAttributes ?? project.id;
  const expanded = project.collapsed !== true && project.threads != null;
  return (
    <div className="flex flex-col gap-0.5" data-active={project.active === true ? "true" : "false"} data-muted={project.muted === true ? "true" : "false"} {...appActionAttributes.sidebarProjectRow({ collapsed: project.collapsed === true, label, projectId: project.id })}>
      <Button className="construct-sidebar-row" onClick={() => onSelect?.(project.id)} variant="ghost" {...appActionAttributes.sidebarProjectSelect}>
        {project.icon != null ? <span data-sidebar-row-icon aria-hidden="true">{project.icon}</span> : null}
        <span data-sidebar-row-label>{project.label}</span>
      </Button>
      {expanded ? <div className="flex flex-col gap-0.5" {...appActionAttributes.sidebarProjectList({ projectId: project.id, showAll: false })}>{project.threads?.map((item) => renderItem?.(item, { inset: true }) ?? <SidebarThreadRow key={item.id} item={item} inset />)}</div> : null}
    </div>
  );
}

export function SidebarThreadRow({ inset = false, item }: { inset?: boolean; item: SidebarItem }) {
  const trailing = item.time ?? item.meta;
  const title = typeof item.title === "string" ? item.title : item.label ?? item.id;
  return (
    <Button className="construct-sidebar-row" data-active={item.active === true ? "true" : "false"} data-inset={inset ? "true" : "false"} data-sidebar-row-layout="split" variant="ghost" {...appActionAttributes.sidebarThreadRow({ active: item.active === true, hostId: item.hostId, id: item.id, kind: item.kind ?? "local", pinned: item.pinned === true, title })}>
      <span data-sidebar-row-label>{item.title}</span>
      {trailing != null ? <span className="shrink-0 text-xs text-muted-foreground">{trailing}</span> : null}
    </Button>
  );
}

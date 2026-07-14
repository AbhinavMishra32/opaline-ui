import type { ReactNode } from "react";

import { cn } from "../lib/utils";
import { AppShell, type AppShellProps } from "../opaline-v2/AppShell";
import { Sidebar, type SidebarProps } from "../opaline-v2/Sidebar";

export type DesktopShellProps = AppShellProps;

/**
 * DesktopShell applies Opaline's inset desktop material to the stable v2 shell
 * controller. Panel state, resizing, history, and mounted children remain owned
 * by AppShell; v3 changes only the composition and surface treatment.
 */
export function DesktopShell({ className, ...props }: DesktopShellProps) {
  return <AppShell className={cn("opaline-v3-desktop-shell", className)} {...props} />;
}

export type DesktopSidebarProps = SidebarProps & {
  header?: ReactNode;
  viewSwitcher?: ReactNode;
};

/**
 * Presentation-only sidebar frame. Product navigation and project state enter
 * through Sidebar props rather than being coupled to a router or data store.
 */
export function DesktopSidebar({ header, viewSwitcher, ...props }: DesktopSidebarProps) {
  return (
    <div className="opaline-v3-sidebar flex h-full min-h-0 flex-col">
      {header != null ? <div className="opaline-v3-sidebar-header">{header}</div> : null}
      {viewSwitcher != null ? <div className="opaline-v3-sidebar-switcher">{viewSwitcher}</div> : null}
      <div className="min-h-0 flex-1">
        <Sidebar {...props} />
      </div>
    </div>
  );
}

export type DesktopHomeSurfaceProps = {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  title: ReactNode;
};

/**
 * A neutral landing surface for a product-owned composer. It intentionally has
 * no prompt, model, provider, or project semantics; those remain in the host.
 */
export function DesktopHomeSurface({
  children,
  className,
  description,
  eyebrow,
  footer,
  title,
}: DesktopHomeSurfaceProps) {
  return (
    <section className={cn("opaline-v3-home", className)}>
      <div className="opaline-v3-home-ambient" aria-hidden="true" />
      <div className="opaline-v3-home-content">
        <header className="opaline-v3-home-heading">
          {eyebrow != null ? <div className="opaline-v3-home-eyebrow">{eyebrow}</div> : null}
          <h1 className="opaline-v3-home-title">{title}</h1>
          {description != null ? <p className="opaline-v3-home-description">{description}</p> : null}
        </header>
        <div className="opaline-v3-home-primary">{children}</div>
        {footer != null ? <footer className="opaline-v3-home-footer">{footer}</footer> : null}
      </div>
    </section>
  );
}

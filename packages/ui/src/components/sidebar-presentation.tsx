"use client"

import * as React from "react"

import { cn } from "../lib/utils"
import { SidebarMenuButton, SidebarMenuItem } from "./sidebar"

export const SIDEBAR_ROW_HEIGHT_CLASS_NAME =
  "min-h-[var(--app-density-row-height,1.75rem)] h-[var(--app-density-row-height,1.75rem)]"

export const SIDEBAR_ROW_RADIUS_CLASS_NAME = "rounded-md"

export const SIDEBAR_ROW_PADDING_CLASS_NAME =
  "px-2 py-[var(--app-density-row-padding-y,0.125rem)]"

export const SIDEBAR_ROW_GAP_CLASS_NAME = "gap-[var(--app-density-row-gap,0.5rem)]"

export const SIDEBAR_ROW_TEXT_CLASS_NAME =
  "text-[length:var(--app-font-size-ui,12px)] font-normal"

export const SIDEBAR_ROW_FOCUS_CLASS_NAME =
  "outline-hidden transition-colors focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"

export const SIDEBAR_ROW_HOVER_CLASS_NAME =
  "hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"

export const SIDEBAR_ROW_ACTIVE_CLASS_NAME =
  "bg-[var(--sidebar-accent-active)] text-[var(--sidebar-accent-foreground)] hover:bg-[var(--sidebar-accent-active)] hover:text-[var(--sidebar-accent-foreground)]"

export const SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME = "text-foreground/89"

export const SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME = "text-foreground/95"

export const SIDEBAR_ROW_MUTED_TEXT_CLASS_NAME = "text-muted-foreground/79"

export const SIDEBAR_SECTION_LABEL_CLASS_NAME =
  "text-[length:var(--app-font-size-ui,12px)] font-normal text-muted-foreground/58"

export const SIDEBAR_HEADER_ROW_CLASS_NAME = [
  "flex w-full min-w-0 cursor-pointer items-center text-left select-none",
  SIDEBAR_ROW_HEIGHT_CLASS_NAME,
  SIDEBAR_ROW_GAP_CLASS_NAME,
  SIDEBAR_ROW_RADIUS_CLASS_NAME,
  SIDEBAR_ROW_PADDING_CLASS_NAME,
  SIDEBAR_ROW_TEXT_CLASS_NAME,
  SIDEBAR_ROW_FOCUS_CLASS_NAME,
].join(" ")

export const SIDEBAR_NESTED_LIST_GAP_CLASS_NAME = "gap-0.5"

export const SIDEBAR_NESTED_LIST_OFFSET_CLASS_NAME = "pt-0.5"

const LEADING_ICON_SIZE = {
  sm: "size-4",
  md: "size-5",
} as const

export type SidebarLeadingIconSize = keyof typeof LEADING_ICON_SIZE

export type SidebarLeadingIconProps = React.HTMLAttributes<HTMLSpanElement> & {
  size?: SidebarLeadingIconSize
  tone?: string
}

export const SidebarLeadingIcon = React.forwardRef<HTMLSpanElement, SidebarLeadingIconProps>(
  function SidebarLeadingIcon(
    { size = "md", tone = "text-muted-foreground/79", className, children, ...props },
    ref
  ) {
    return (
      <span
        {...props}
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          LEADING_ICON_SIZE[size],
          tone,
          className
        )}
      >
        {children}
      </span>
    )
  }
)

function SidebarLeadingGlyph({ icon }: { icon: React.ReactNode }) {
  if (!React.isValidElement<{ className?: string }>(icon)) {
    return icon
  }

  return React.cloneElement(icon, {
    "aria-hidden": true,
    className: cn(icon.props.className, "size-[15px] shrink-0"),
  } as React.HTMLAttributes<HTMLElement>)
}

export type SidebarPrimaryActionProps = Omit<
  React.ComponentProps<typeof SidebarMenuButton>,
  "children" | "size" | "isActive"
> & {
  active?: boolean
  badge?: React.ReactNode
  icon: React.ReactNode
  label: React.ReactNode
}

export function SidebarPrimaryAction({
  active = false,
  badge,
  className,
  icon,
  label,
  ...props
}: SidebarPrimaryActionProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        {...props}
        size="sm"
        data-active={active}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group/sidebar-primary-action",
          SIDEBAR_HEADER_ROW_CLASS_NAME,
          active
            ? SIDEBAR_ROW_ACTIVE_CLASS_NAME
            : cn(SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME, SIDEBAR_ROW_HOVER_CLASS_NAME),
          className
        )}
      >
        <SidebarLeadingIcon size="sm" tone="text-inherit">
          <SidebarLeadingGlyph icon={icon} />
        </SidebarLeadingIcon>
        <span className="truncate">{label}</span>
        {badge != null ? <span className="ml-auto">{badge}</span> : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export type SidebarProjectButtonProps = Omit<
  React.ComponentProps<typeof SidebarMenuButton>,
  "children" | "size" | "isActive"
> & {
  active?: boolean
  icon: React.ReactNode
  label: React.ReactNode
  trailing?: React.ReactNode
}

export function SidebarProjectButton({
  active = false,
  className,
  icon,
  label,
  trailing,
  ...props
}: SidebarProjectButtonProps) {
  return (
    <SidebarMenuButton
      {...props}
      size="sm"
      data-active={active}
      aria-current={active ? "page" : undefined}
      className={cn(
        SIDEBAR_HEADER_ROW_CLASS_NAME,
        active ? SIDEBAR_ROW_ACTIVE_CLASS_NAME : SIDEBAR_ROW_HOVER_CLASS_NAME,
        className
      )}
    >
      <SidebarLeadingIcon size="sm" tone={SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME}>
        <SidebarLeadingGlyph icon={icon} />
      </SidebarLeadingIcon>
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-system-ui text-[length:var(--app-font-size-ui,12px)] font-normal",
          SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME
        )}
      >
        {label}
      </span>
      {trailing}
    </SidebarMenuButton>
  )
}

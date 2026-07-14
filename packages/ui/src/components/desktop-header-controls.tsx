"use client"

import { forwardRef, type ComponentProps, type ReactNode } from "react"

import { cn } from "#lib/utils"

import { Button } from "./button"

export const DESKTOP_HEADER_ICON_STRENGTH_CLASS_NAME =
  "text-[var(--color-text-foreground)] [&_svg]:!opacity-100"

export const DESKTOP_HEADER_CONTROL_CLASS_NAME = "!h-7 shrink-0 rounded-lg"

export const DESKTOP_HEADER_ICON_CONTROL_CLASS_NAME =
  "!size-7 shrink-0 rounded-lg [&_svg,&_[data-slot=central-icon]]:mx-0"

export type DesktopHeaderControlTone = "plain" | "outline"

export function desktopHeaderControlVariant(
  tone: DesktopHeaderControlTone
): NonNullable<ComponentProps<typeof Button>["variant"]> {
  return tone === "outline" ? "chrome-outline" : "chrome"
}

type DesktopHeaderButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
  tone?: DesktopHeaderControlTone
}

export const DesktopHeaderButton = forwardRef<HTMLButtonElement, DesktopHeaderButtonProps>(
  function DesktopHeaderButton({ tone = "outline", className, ...props }, ref) {
    return (
      <Button
        {...props}
        ref={ref}
        size="xs"
        variant={desktopHeaderControlVariant(tone)}
        className={cn(
          DESKTOP_HEADER_CONTROL_CLASS_NAME,
          DESKTOP_HEADER_ICON_STRENGTH_CLASS_NAME,
          className
        )}
      />
    )
  }
)

type DesktopHeaderIconButtonProps = Omit<
  ComponentProps<typeof Button>,
  "variant" | "size" | "aria-label"
> & {
  label: string
  tone?: DesktopHeaderControlTone
  children?: ReactNode
}

export const DesktopHeaderIconButton = forwardRef<
  HTMLButtonElement,
  DesktopHeaderIconButtonProps
>(function DesktopHeaderIconButton(
  { label, tone = "plain", className, children, ...props },
  ref
) {
  return (
    <Button
      {...props}
      ref={ref}
      aria-label={label}
      size="icon-xs"
      variant={desktopHeaderControlVariant(tone)}
      className={cn(
        DESKTOP_HEADER_ICON_CONTROL_CLASS_NAME,
        DESKTOP_HEADER_ICON_STRENGTH_CLASS_NAME,
        className
      )}
    >
      {children}
    </Button>
  )
})

export type { DesktopHeaderButtonProps, DesktopHeaderIconButtonProps }

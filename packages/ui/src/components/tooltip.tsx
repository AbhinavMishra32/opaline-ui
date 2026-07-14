import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "#lib/utils"

const APP_TRANSLUCENT_POPUP_SURFACE_BASE_CLASS_NAME =
  "relative overflow-hidden border border-border bg-popover/70 text-popover-foreground before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150"
const APP_TOOLTIP_SURFACE_CLASS_NAME =
  `${APP_TRANSLUCENT_POPUP_SURFACE_BASE_CLASS_NAME} rounded-lg shadow-xl`
const COMPOSER_SURFACE_SHADOW_CLASS_NAME =
  "shadow-[0_4px_18px_-6px_color-mix(in_srgb,var(--foreground)_7%,transparent)] dark:shadow-[0_6px_24px_-10px_rgba(0,0,0,0.30)]"
const COMPOSER_PICKER_MENU_SURFACE_CLASS_NAME =
  `${APP_TRANSLUCENT_POPUP_SURFACE_BASE_CLASS_NAME} border border-border rounded-[0.65rem] ${COMPOSER_SURFACE_SHADOW_CLASS_NAME}`
const COMPOSER_PICKER_TOOLTIP_SURFACE_CLASS_NAME =
  `${COMPOSER_PICKER_MENU_SURFACE_CLASS_NAME} font-normal text-[var(--color-text-foreground)]`

const TooltipCreateHandle = TooltipPrimitive.createHandle
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root

export type TooltipVariant = "default" | "picker"

const TOOLTIP_SURFACE_BY_VARIANT: Record<TooltipVariant, string> = {
  default: APP_TOOLTIP_SURFACE_CLASS_NAME,
  picker: COMPOSER_PICKER_TOOLTIP_SURFACE_CLASS_NAME,
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipPopup({
  className,
  positionerClassName,
  viewportClassName,
  variant = "default",
  align = "center",
  sideOffset = 4,
  side = "top",
  anchor,
  children,
  ...props
}: TooltipPrimitive.Popup.Props & {
  align?: TooltipPrimitive.Positioner.Props["align"]
  side?: TooltipPrimitive.Positioner.Props["side"]
  sideOffset?: TooltipPrimitive.Positioner.Props["sideOffset"]
  anchor?: TooltipPrimitive.Positioner.Props["anchor"]
  variant?: TooltipVariant
  positionerClassName?: string
  viewportClassName?: string
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        anchor={anchor}
        className={cn(
          "z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom,transform] data-instant:transition-none",
          positionerClassName
        )}
        data-slot="tooltip-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <TooltipPrimitive.Popup
          className={cn(
            "flex h-(--popup-height,auto) w-(--popup-width,auto) origin-(--transform-origin) text-balance text-[length:var(--app-font-size-ui-sm,11px)] transition-[width,height,scale,opacity] data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 data-instant:duration-0",
            TOOLTIP_SURFACE_BY_VARIANT[variant],
            className
          )}
          data-slot="tooltip-popup"
          {...props}
        >
          <TooltipPrimitive.Viewport
            className={cn(
              "relative size-full overflow-clip px-(--viewport-inline-padding) py-1 [--viewport-inline-padding:--spacing(2)] data-instant:transition-none **:data-current:data-ending-style:opacity-0 **:data-current:data-starting-style:opacity-0 **:data-previous:data-ending-style:opacity-0 **:data-previous:data-starting-style:opacity-0 **:data-current:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding)-2px)] **:data-previous:w-[calc(var(--popup-width)-2*var(--viewport-inline-padding)-2px)] **:data-previous:truncate **:data-current:opacity-100 **:data-previous:opacity-100 **:data-current:transition-opacity **:data-previous:transition-opacity",
              viewportClassName
            )}
            data-slot="tooltip-viewport"
          >
            {children}
          </TooltipPrimitive.Viewport>
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export {
  TooltipCreateHandle,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
  TooltipPopup as TooltipContent,
}

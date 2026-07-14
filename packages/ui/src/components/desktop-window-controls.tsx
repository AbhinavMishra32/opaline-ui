"use client"

import { cn } from "../lib/utils"

const GLYPH_MINIMIZE = "\uE921"
const GLYPH_MAXIMIZE = "\uE922"
const GLYPH_RESTORE = "\uE923"
const GLYPH_CLOSE = "\uE8BB"

const CAPTION_BUTTON_CLASS =
  "flex h-full w-[46px] shrink-0 items-center justify-center text-foreground/90 outline-none transition-colors duration-75 select-none hover:bg-foreground/[0.09] active:bg-foreground/[0.05] [-webkit-app-region:no-drag]"

const CLOSE_BUTTON_CLASS = "hover:bg-[#c42b1c] hover:text-white active:bg-[#b9281b]"

function CaptionGlyph({ glyph }: { glyph: string }) {
  return (
    <span
      aria-hidden="true"
      className="text-[10px] leading-none"
      style={{ fontFamily: '"Segoe Fluent Icons", "Segoe MDL2 Assets"' }}
    >
      {glyph}
    </span>
  )
}

export type DesktopWindowControlsProps = {
  className?: string
  isMaximized: boolean
  onClose: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
}

export function DesktopWindowControls({
  className,
  isMaximized,
  onClose,
  onMinimize,
  onToggleMaximize,
}: DesktopWindowControlsProps) {
  return (
    <div className={cn("flex h-[46px] items-stretch [-webkit-app-region:no-drag]", className)}>
      <button
        type="button"
        aria-label="Minimize"
        title="Minimize"
        className={CAPTION_BUTTON_CLASS}
        onClick={onMinimize}
      >
        <CaptionGlyph glyph={GLYPH_MINIMIZE} />
      </button>
      <button
        type="button"
        aria-label={isMaximized ? "Restore" : "Maximize"}
        title={isMaximized ? "Restore" : "Maximize"}
        className={CAPTION_BUTTON_CLASS}
        onClick={onToggleMaximize}
      >
        <CaptionGlyph glyph={isMaximized ? GLYPH_RESTORE : GLYPH_MAXIMIZE} />
      </button>
      <button
        type="button"
        aria-label="Close"
        title="Close"
        className={cn(CAPTION_BUTTON_CLASS, CLOSE_BUTTON_CLASS)}
        onClick={onClose}
      >
        <CaptionGlyph glyph={GLYPH_CLOSE} />
      </button>
    </div>
  )
}

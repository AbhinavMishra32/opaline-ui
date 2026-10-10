import * as React from "react"

import { cn } from "../lib/utils"

/**
 * A bordered surface for a group of rows — a settings section, a summary.
 * A hairline and a contact shadow; the page is the ground, the card sits on it.
 * For a working pane inset into a canvas, use `Sheet` instead.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col rounded-xl bg-card text-card-foreground shadow-[0_0_0_var(--hairline)_var(--border-surface-strong),var(--shadow-card)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1 px-4 pt-4 pb-2", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("text-content font-semibold tracking-[-0.01em]", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-ui text-muted-foreground", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4 pb-4", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-2 border-t border-border px-4 py-3", className)} {...props} />
}

/** One row of a card: a label and its control, divided from the next by a hairline. */
function CardRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-row"
      className={cn("flex min-h-12 items-center justify-between gap-4 px-4 py-2.5 text-content not-last:border-b not-last:border-border", className)}
      {...props}
    />
  )
}

/**
 * A working sheet: a rounded pane inset into a canvas of nearly its own value,
 * with the superellipse corner and an edge drawn over its content.
 */
function Sheet({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet" className={cn("op-sheet bg-background", className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardRow, Sheet }

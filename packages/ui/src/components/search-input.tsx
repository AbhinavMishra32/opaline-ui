"use client"

import { Search } from "lucide-react"
import { forwardRef } from "react"

import { cn } from "../lib/utils"
import { Input, type InputProps } from "./input"

export const SearchInput = forwardRef<HTMLInputElement, InputProps>(function SearchInput(
  { className, type = "text", size = "sm", variant = "soft", ...props },
  ref
) {
  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        type={type}
        size={size}
        variant={variant}
        className={cn("[&>[data-slot=input]]:pl-8", className)}
        {...props}
      />
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/70"
        aria-hidden="true"
      />
    </div>
  )
})

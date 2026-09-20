"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Switch({ className, size = "default", ...props }: React.ComponentProps<typeof SwitchPrimitive.Root> & { size?: "default" | "sm" }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group inline-flex shrink-0 items-center rounded-full border border-transparent bg-secondary p-px shadow-inner outline-none transition-colors duration-200 data-[state=checked]:bg-primary focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-[1.1rem] w-[1.8rem]" : "h-[1.35rem] w-[2.3rem]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className={cn("pointer-events-none block rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none", size === "sm" ? "size-[0.8rem] translate-x-0 data-[state=checked]:translate-x-[0.7rem]" : "size-[1.05rem] translate-x-0 data-[state=checked]:translate-x-[0.95rem]")} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

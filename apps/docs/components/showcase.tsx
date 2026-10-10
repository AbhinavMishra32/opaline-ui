"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Badge, Button, Kbd, KbdGroup, Meter, Segmented, Switch, TooltipProvider } from "@opaline/ui"
import { Orb } from "@opaline/ui/thread"

/** A handful of the primitives, live, under the hero. */
export function Showcase() {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system")
  return (
    <TooltipProvider>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Button">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Continue</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </div>
        </Tile>
        <Tile label="Segmented">
          <Segmented
            ariaLabel="Appearance"
            className="w-full"
            onChange={setTheme}
            options={[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "Auto", icon: Monitor },
            ]}
            value={theme}
          />
        </Tile>
        <Tile label="Switch">
          <div className="flex items-center gap-3">
            <Switch defaultChecked />
            <Switch />
            <Switch defaultChecked size="sm" />
          </div>
        </Tile>
        <Tile label="Orb">
          <div className="flex items-center gap-3">
            {(["working", "searching", "connecting", "shaping", "solving", "weaving"] as const).map((kind) => (
              <Orb key={kind} kind={kind} size={20} />
            ))}
          </div>
        </Tile>
        <Tile label="Meter">
          <Meter
            bands={[
              { key: "a", value: 42, label: "Passed", className: "bg-success" },
              { key: "b", value: 6, label: "Slow", className: "bg-warning" },
              { key: "c", value: 3, label: "Failed", className: "bg-destructive" },
            ]}
          />
        </Tile>
        <Tile label="Badge · Kbd">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Passed</Badge>
            <Badge variant="muted">Draft</Badge>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </div>
        </Tile>
      </div>
    </TooltipProvider>
  )
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-32 flex-col justify-between gap-4 rounded-xl border bg-card p-4">
      <p className="text-ui-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex min-h-10 items-center">{children}</div>
    </div>
  )
}

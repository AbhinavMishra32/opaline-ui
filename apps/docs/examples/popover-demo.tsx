import { SlidersHorizontal } from "lucide-react"
import { Button, Label, Popover, PopoverContent, PopoverTrigger, Switch } from "@opaline/ui"

export default function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal data-icon="inline-start" /> View
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64 p-3">
        <div className="grid gap-3">
          <p className="text-ui font-medium">Thread view</p>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="show-steps">Show every step</Label>
            <Switch id="show-steps" size="sm" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="show-time">Timestamps</Label>
            <Switch defaultChecked id="show-time" size="sm" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

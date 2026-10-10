import { Label, Switch } from "@opaline/ui"

export default function SwitchDemo() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <Switch defaultChecked id="sw-1" />
        <Label htmlFor="sw-1">Stream replies</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="sw-2" size="sm" />
        <Label htmlFor="sw-2">Compact rows</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch disabled id="sw-3" />
        <Label htmlFor="sw-3">Unavailable</Label>
      </div>
    </div>
  )
}

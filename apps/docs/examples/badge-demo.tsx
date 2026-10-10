import { Badge } from "@opaline/ui"

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="muted">Draft</Badge>
      <Badge variant="success">Passed</Badge>
      <Badge variant="warning">Slow</Badge>
      <Badge variant="destructive">Failed</Badge>
    </div>
  )
}

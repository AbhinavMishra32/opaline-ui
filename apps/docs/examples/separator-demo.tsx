import { Separator } from "@opaline/ui"

export default function SeparatorDemo() {
  return (
    <div className="w-full max-w-xs text-ui">
      <p className="font-medium">Opaline UI</p>
      <p className="text-muted-foreground">Quiet surfaces for desktop apps.</p>
      <Separator className="my-3" />
      <div className="flex h-4 items-center gap-3 text-muted-foreground">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Components</span>
        <Separator orientation="vertical" />
        <span>Thread</span>
      </div>
    </div>
  )
}

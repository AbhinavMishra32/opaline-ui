import { AlignCenter, AlignLeft, AlignRight, Bold, Italic } from "lucide-react"
import { Toggle, ToggleGroup, ToggleGroupItem } from "@opaline/ui"

export default function ToggleDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex gap-1">
        <Toggle aria-label="Bold" defaultPressed>
          <Bold />
        </Toggle>
        <Toggle aria-label="Italic" variant="outline">
          <Italic />
        </Toggle>
      </div>
      <ToggleGroup defaultValue="left" spacing={0} type="single" variant="outline">
        <ToggleGroupItem aria-label="Left" value="left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Center" value="center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Right" value="right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

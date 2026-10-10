import { ArrowRight, Plus, Settings2 } from "lucide-react"
import { Button } from "@opaline/ui"

export default function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button>
        New thread <ArrowRight data-icon="inline-end" />
      </Button>
      <Button size="lg">
        <Plus data-icon="inline-start" /> Large
      </Button>
      <Button aria-label="Settings" size="icon" variant="outline">
        <Settings2 />
      </Button>
      <Button aria-label="Add" size="icon-sm" variant="ghost">
        <Plus />
      </Button>
    </div>
  )
}

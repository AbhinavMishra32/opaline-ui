import { Bold, Italic, Underline } from "lucide-react"
import { Button, Tooltip, TooltipContent, TooltipKeys, TooltipProvider, TooltipTrigger } from "@opaline/ui"

const actions = [
  { label: "Bold", keys: "⌘B", icon: Bold },
  { label: "Italic", keys: "⌘I", icon: Italic },
  { label: "Underline", keys: "⌘U", icon: Underline },
]

export default function TooltipDemo() {
  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {actions.map(({ label, keys, icon: Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button aria-label={label} size="icon-sm" variant="ghost">
                <Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {label} <TooltipKeys>{keys}</TooltipKeys>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

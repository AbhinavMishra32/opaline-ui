import * as React from "react"
import { Code2, Eye, MessageSquare } from "lucide-react"
import { ViewSwitch } from "@opaline/ui"

export default function ViewSwitchDemo() {
  const [view, setView] = React.useState<"thread" | "diff" | "preview">("thread")
  return (
    <ViewSwitch
      ariaLabel="Panel"
      className="w-80"
      onChange={setView}
      options={[
        { value: "thread", label: "Thread", icon: MessageSquare },
        { value: "diff", label: "Diff", icon: Code2, badge: <span className="text-ui-sm text-muted-foreground">3</span> },
        { value: "preview", label: "Preview", icon: Eye },
      ]}
      value={view}
    />
  )
}

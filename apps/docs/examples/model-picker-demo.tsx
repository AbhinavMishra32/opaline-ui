import * as React from "react"
import { TooltipProvider } from "@opaline/ui"
import { ContextUsage, EffortPicker, ModelPicker, UsageRow, type ModelValue } from "@opaline/ui/thread"
import { providers } from "@/lib/models"

export default function ModelPickerDemo() {
  const [model, setModel] = React.useState<ModelValue>({ provider: "anthropic", model: "claude-opus-5-5" })
  const [effort, setEffort] = React.useState("high")
  const [fast, setFast] = React.useState(false)
  const reasons = providers.find((p) => p.id === model.provider)?.models.find((m) => m.id === model.model)?.reasoning

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <ContextUsage total={200_000} used={64_000}>
          <UsageRow label="5 hours" value="81% left" />
          <UsageRow label="Weekly" value="62% left" />
        </ContextUsage>
        <ModelPicker onValueChange={setModel} providers={providers} value={model} />
        {reasons && <EffortPicker fastMode={fast} onFastModeChange={setFast} onValueChange={setEffort} value={effort} />}
      </div>
    </TooltipProvider>
  )
}

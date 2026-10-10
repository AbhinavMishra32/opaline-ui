import * as React from "react"
import { ChoiceGroup, RatingPicker, type Rating } from "@opaline/ui"

export default function ChoiceGroupDemo() {
  const [rating, setRating] = React.useState<Rating | null>(null)
  const [size, setSize] = React.useState<"s" | "m" | "l">("m")
  return (
    <div className="flex w-full max-w-md flex-col gap-6 op-thread">
      <RatingPicker
        intervals={{ again: "<1m", hard: "6m", good: "1d", easy: "4d" }}
        onValueChange={setRating}
        suggested="good"
        value={rating}
      />
      <p className="text-center text-sm text-muted-foreground">{rating ? `Rated ${rating}` : "Press 1–4, or click"}</p>
      <ChoiceGroup
        aria-label="Size"
        onValueChange={setSize}
        options={[
          { value: "s", label: "Small", sublabel: "8 cards", shortcut: "s" },
          { value: "m", label: "Medium", sublabel: "20 cards", shortcut: "m" },
          { value: "l", label: "Large", sublabel: "50 cards", shortcut: "l", disabled: true },
        ]}
        shortcutScope="group"
        value={size}
      />
    </div>
  )
}

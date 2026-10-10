import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Segmented } from "@opaline/ui"

export default function SegmentedDemo() {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system")
  return (
    <Segmented
      ariaLabel="Appearance"
      className="w-72"
      onChange={setTheme}
      options={[
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
        { value: "system", label: "System", icon: Monitor },
      ]}
      value={theme}
    />
  )
}

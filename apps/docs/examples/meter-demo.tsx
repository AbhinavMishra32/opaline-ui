import { Meter, MeterKey, type MeterBand } from "@opaline/ui"

const bands: MeterBand[] = [
  { key: "passed", value: 42, label: "Passed", className: "bg-success" },
  { key: "slow", value: 6, label: "Slow", className: "bg-warning" },
  { key: "failed", value: 3, label: "Failed", className: "bg-destructive" },
]

export default function MeterDemo() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Meter bands={bands} total={60} />
      <div className="flex flex-wrap gap-4">
        {bands.map((band) => (
          <MeterKey band={band} key={band.key} />
        ))}
      </div>
    </div>
  )
}

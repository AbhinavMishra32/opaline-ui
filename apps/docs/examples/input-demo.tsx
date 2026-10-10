import { Input } from "@opaline/ui"

export default function InputDemo() {
  return (
    <div className="grid w-full max-w-xs gap-2">
      <Input placeholder="Name this thread" />
      <Input disabled placeholder="Disabled" />
      <Input aria-invalid defaultValue="not-an-email" />
    </div>
  )
}

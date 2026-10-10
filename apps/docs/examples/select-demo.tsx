import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@opaline/ui"

export default function SelectDemo() {
  return (
    <Select defaultValue="balanced">
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Effort" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Effort</SelectLabel>
          <SelectItem value="quick">Quick</SelectItem>
          <SelectItem value="balanced">Balanced</SelectItem>
          <SelectItem value="thorough">Thorough</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="custom">Custom…</SelectItem>
      </SelectContent>
    </Select>
  )
}

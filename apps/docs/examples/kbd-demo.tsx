import { Kbd, KbdGroup } from "@opaline/ui"

export default function KbdDemo() {
  return (
    <p className="flex flex-wrap items-center gap-2 text-ui text-muted-foreground">
      Press
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
      to search, or <Kbd>Esc</Kbd> to close.
    </p>
  )
}

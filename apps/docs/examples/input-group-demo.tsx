import { ArrowUp, Search } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea, Kbd } from "@opaline/ui"

export default function InputGroupDemo() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search threads" />
        <InputGroupAddon align="inline-end">
          <Kbd>⌘K</Kbd>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea placeholder="Ask a follow-up…" />
        <InputGroupAddon align="block-end">
          <InputGroupText className="mr-auto">Shift ⏎ for a new line</InputGroupText>
          <InputGroupButton aria-label="Send" className="rounded-full" size="icon-xs" variant="default">
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

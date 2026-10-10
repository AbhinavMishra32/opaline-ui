import { FileText, GitBranch, MessageSquarePlus, Settings } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@opaline/ui"

export default function CommandDemo() {
  return (
    <Command className="op-floating w-full max-w-sm rounded-xl">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        <CommandGroup heading="Threads">
          <CommandItem>
            <MessageSquarePlus /> New thread <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <FileText /> Open file… <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Workspace">
          <CommandItem>
            <GitBranch /> Switch branch
          </CommandItem>
          <CommandItem>
            <Settings /> Settings <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

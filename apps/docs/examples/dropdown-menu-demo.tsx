import * as React from "react"
import { Archive, Copy, Ellipsis, Pencil, Pin, Trash2 } from "lucide-react"
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@opaline/ui"

export default function DropdownMenuDemo() {
  const [pinned, setPinned] = React.useState(true)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Thread actions" size="icon" variant="outline">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>Thread</DropdownMenuLabel>
        <DropdownMenuItem>
          <Pencil /> Rename <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuCheckItem checked={pinned} onCheckedChange={setPinned}>
          <Pin /> Pinned
        </DropdownMenuCheckItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Archive /> Move to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Inbox</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 /> Delete <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

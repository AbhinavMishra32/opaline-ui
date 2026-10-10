import { MessageSquareDashed } from "lucide-react"
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@opaline/ui"

export default function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageSquareDashed />
        </EmptyMedia>
        <EmptyTitle>No threads yet</EmptyTitle>
        <EmptyDescription>Start one and it will show up here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">New thread</Button>
      </EmptyContent>
    </Empty>
  )
}

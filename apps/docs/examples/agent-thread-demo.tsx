import * as React from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@opaline/ui"
import { AgentThread } from "@opaline/ui/thread"
import { demoScript } from "@/lib/demo-script"
import { usePlayback } from "@/lib/use-playback"

export default function AgentThreadDemo() {
  const { messages, playing, play, stop } = usePlayback()
  const runs = React.useRef(0)

  const replay = () => play(demoScript(`run-${++runs.current}`), { reset: true })
  React.useEffect(replay, [])

  return (
    <AgentThread
      composer={{
        trailing: (
          <Button disabled={playing} onClick={replay} size="xs" variant="ghost">
            <RotateCcw data-icon="inline-start" /> Replay
          </Button>
        ),
      }}
      messages={messages}
      onSend={(text) => play(demoScript(`run-${++runs.current}`, text))}
      onStop={stop}
    />
  )
}

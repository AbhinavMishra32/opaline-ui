"use client"

import * as React from "react"
import { reduceThread, type ThreadMessage } from "@opaline/ui/thread"
import type { Cue } from "./demo-script"

/**
 * Plays a scripted turn into thread messages through `reduceThread`, the same
 * reducer a real stream goes through, so the demo exercises exactly the code
 * an app would.
 */
export function usePlayback(initial: ThreadMessage[] = []) {
  const [messages, setMessages] = React.useState<ThreadMessage[]>(initial)
  const [playing, setPlaying] = React.useState(false)
  const timers = React.useRef<number[]>([])
  const turn = React.useRef<string | null>(null)

  const clear = () => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
  }

  const play = React.useCallback((cues: Cue[], { reset = false } = {}) => {
    clear()
    if (reset) setMessages([])
    const last = cues.at(-1)
    turn.current = cues.find((cue) => cue.event.type === "turn-start")?.event.id ?? null
    setPlaying(true)
    for (const { at, event } of cues) {
      timers.current.push(window.setTimeout(() => setMessages((current) => reduceThread(current, event)), at))
    }
    if (last) timers.current.push(window.setTimeout(() => setPlaying(false), last.at + 1))
  }, [])

  const stop = React.useCallback(() => {
    clear()
    setPlaying(false)
    if (turn.current) {
      const id = turn.current
      setMessages((current) => reduceThread(current, { type: "turn-end", id }))
    }
  }, [])

  React.useEffect(() => clear, [])

  return { messages, setMessages, playing, play, stop }
}

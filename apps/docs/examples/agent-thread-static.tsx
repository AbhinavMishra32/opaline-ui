import * as React from "react"
import { AgentThread, type ThreadMessage } from "@opaline/ui/thread"
import { demoMessages } from "@/lib/demo-script"

export default function AgentThreadStatic() {
  const [messages, setMessages] = React.useState<ThreadMessage[]>(demoMessages)
  return (
    <AgentThread
      messages={messages}
      onRate={(id, rating) =>
        setMessages((current) => current.map((message) => (message.id === id && message.role === "assistant" ? { ...message, rating } : message)))
      }
    />
  )
}

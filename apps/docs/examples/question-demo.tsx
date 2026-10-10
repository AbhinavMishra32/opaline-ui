import * as React from "react"
import { AgentThread, type QuestionAnswer, type ThreadMessage } from "@opaline/ui/thread"

const asked: ThreadMessage[] = [
  { id: "u1", role: "user", text: "Make me a deck from chapter 3." },
  {
    id: "a1",
    role: "assistant",
    status: "streaming",
    startedAt: Date.now(),
    parts: [
      {
        type: "question",
        id: "q1",
        status: "pending",
        questions: [
          {
            header: "Size",
            question: "How many cards should the deck have?",
            options: [
              { label: "About 20", description: "The key terms only" },
              { label: "About 50", description: "Terms and worked examples" },
            ],
          },
          { header: "Style", question: "Which card types?", multiple: true, options: [{ label: "Basic" }, { label: "Cloze" }, { label: "Image occlusion" }] },
        ],
      },
    ],
  },
]

export default function QuestionDemo() {
  const [messages, setMessages] = React.useState(asked)
  const answer = (partId: string, answers: QuestionAnswer[]) =>
    setMessages((current) =>
      current.map((message) =>
        message.role !== "assistant"
          ? message
          : {
              ...message,
              status: "done",
              durationMs: 4000,
              parts: [
                ...message.parts.map((part) => (part.id === partId && part.type === "question" ? { ...part, status: "answered" as const, answers } : part)),
                { type: "text" as const, id: "t1", text: "Got it — building the deck now." },
              ],
            },
      ),
    )
  return (
    <div className="flex h-[30rem] w-full">
      <AgentThread messages={messages} onAnswer={answer} onCancelQuestion={() => setMessages(asked)} onSend={() => undefined} />
    </div>
  )
}

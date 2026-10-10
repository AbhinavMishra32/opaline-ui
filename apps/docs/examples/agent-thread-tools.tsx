import { FlaskConical } from "lucide-react"
import { AgentThread, defineTool, defineTools, type ThreadMessage } from "@opaline/ui/thread"

type TestRun = { passed: number; failed: number; failures: string[] }

const tools = defineTools({
  run_tests: defineTool<{ pattern: string }, TestRun>({
    icon: FlaskConical,
    orb: "solving",
    title: ({ status }) => (status === "running" ? "Running tests" : "Ran tests"),
    subject: ({ input }) => input.pattern,
    detail: ({ output }) => output && `${output.passed} passed${output.failed ? `, ${output.failed} failed` : ""}`,
    render: ({ output }) => (
      <ul className="grid gap-1 p-3 font-mono text-thread-tool">
        {output.failures.map((name) => (
          <li className="text-destructive" key={name}>
            ✕ {name}
          </li>
        ))}
        <li className="text-muted-foreground">✓ {output.passed} others passed</li>
      </ul>
    ),
  }),
})

const now = Date.now()
const messages: ThreadMessage[] = [
  { id: "u1", role: "user", text: "Run the checkout tests." },
  {
    id: "a1",
    role: "assistant",
    status: "done",
    startedAt: now - 9000,
    durationMs: 6400,
    replyFrom: 1,
    parts: [
      {
        type: "tool",
        id: "t1",
        name: "run_tests",
        status: "done",
        input: { pattern: "checkout/**" },
        output: { passed: 31, failed: 2, failures: ["applies a discount code", "rejects an expired card"] },
        startedAt: now - 8800,
        endedAt: now - 2900,
      },
      { type: "text", id: "x1", text: "31 passed and 2 failed. Both failures are in **payment validation**; want me to look?" },
    ],
  },
]

export default function AgentThreadTools() {
  return <AgentThread fold="open" messages={messages} tools={tools} />
}

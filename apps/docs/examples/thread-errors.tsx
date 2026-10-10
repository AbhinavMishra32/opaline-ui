import { AgentThread, type ThreadMessage } from "@opaline/ui/thread"

const now = Date.now()
const messages: ThreadMessage[] = [
  { id: "u1", role: "user", text: "Deploy the preview branch." },
  {
    id: "a1",
    role: "assistant",
    status: "error",
    startedAt: now - 12000,
    parts: [
      { type: "tool", id: "t1", name: "run_command", status: "done", input: { command: "vercel deploy --prebuilt" }, output: "Uploading 214 files…", startedAt: now - 11500, endedAt: now - 6000 },
      { type: "status", id: "s1", text: "Rate limited by the deploy API, retrying in 5s", tone: "warning" },
      { type: "tool", id: "t2", name: "run_command", status: "error", input: { command: "vercel deploy --prebuilt" }, error: "Error: token expired (401)", startedAt: now - 5000, endedAt: now - 3000 },
      { type: "error", id: "e1", title: "The deploy failed", text: "Your Vercel token expired. Reconnect Vercel in Settings and ask again." },
    ],
  },
]

export default function ThreadErrors() {
  return <AgentThread fold="open" messages={messages} />
}

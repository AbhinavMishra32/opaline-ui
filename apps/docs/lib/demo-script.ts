import { reduceThreadBatch, type ThreadEvent, type ThreadMessage } from "@opaline/ui/thread"

/** One event of a scripted turn, `at` milliseconds after the turn starts. */
export type Cue = { at: number; event: ThreadEvent }

const words = (text: string) => text.match(/\S+\s*|\s+/g) ?? []

/**
 * A turn of a coding agent, as the events it would stream: thinking, a search,
 * a read, more thinking, an edit, a test run, then the answer token by token.
 * Played live it is the landing demo; reduced at once it is the static example.
 */
export function demoScript(turn = "demo", ask = "The login test is flaky on CI. Can you find out why and fix it?"): Cue[] {
  const cues: Cue[] = []
  let t = 0
  const at = (wait: number, event: ThreadEvent) => {
    t += wait
    cues.push({ at: t, event })
  }
  const stream = (type: "text-delta" | "reasoning-delta", text: string, pace: number) => {
    for (const word of words(text)) at(pace, { type, id: turn, delta: word })
  }

  at(0, { type: "user", id: `${turn}-ask`, text: ask })
  at(500, { type: "turn-start", id: turn })

  at(900, { type: "reasoning-start", id: turn })
  stream(
    "reasoning-delta",
    "**Reading the failure**\n\nIt passes locally and fails on CI about one run in five. That smells like timing: something racing the session refresh. I'll find where the refresh is scheduled, then look at how the test waits for login.",
    34,
  )
  at(300, { type: "reasoning-end", id: turn })

  at(250, { type: "tool-start", id: turn, callId: `${turn}-c1`, name: "search_code", input: { query: "refreshSession" } })
  at(1100, {
    type: "tool-end",
    id: turn,
    callId: `${turn}-c1`,
    detail: "3 matches",
    output: "src/auth/session.ts:42   setTimeout(() => refreshSession(id), 0)\nsrc/auth/refresh.ts:12   export async function refreshSession(id: string) {\ntest/login.spec.ts:18    expect(cookies.get(\"sid\")).toBeDefined()",
  })

  at(250, { type: "tool-start", id: turn, callId: `${turn}-c2`, name: "read_file", input: { path: "src/auth/session.ts" } })
  at(800, {
    type: "tool-end",
    id: turn,
    callId: `${turn}-c2`,
    detail: "58 lines",
    output: "export async function createSession(user: User) {\n  const session = await store.create(user)\n  setTimeout(() => refreshSession(session.id), 0)\n  return session\n}",
  })

  at(300, { type: "reasoning-start", id: turn })
  stream(
    "reasoning-delta",
    "**Found the race**\n\n`createSession` schedules the first refresh on a zero-delay timer and returns. The test reads the cookie straight away, so on a slow runner it reads it before the refresh has written it. Login should wait for that first refresh.",
    30,
  )
  at(250, { type: "reasoning-end", id: turn })

  at(200, { type: "tool-start", id: turn, callId: `${turn}-c3`, name: "edit_file", input: { path: "src/auth/session.ts" } })
  at(1000, { type: "tool-end", id: turn, callId: `${turn}-c3`, diff: { added: 2, removed: 1 } })

  at(250, { type: "tool-start", id: turn, callId: `${turn}-c4`, name: "run_command", input: { command: "pnpm test login --repeat 50" } })
  at(2200, {
    type: "tool-end",
    id: turn,
    callId: `${turn}-c4`,
    detail: "50 passed",
    output: "✓ login › keeps the session after refresh (50/50)\n\nTest Files  1 passed (1)\n     Tests  50 passed (50)\n  Duration  8.42s",
  })

  at(500, { type: "reply-start", id: turn })
  stream(
    "text-delta",
    "The flake was a race between login and the first session refresh.\n\n`createSession` scheduled `refreshSession()` on a zero-delay timer, so the test could read the cookie **before** the refresh wrote it. On a fast laptop the refresh always won; on CI it lost about one run in five.\n\nLogin now waits for the first refresh instead of scheduling it:\n\n```ts\nexport async function createSession(user: User) {\n  const session = await store.create(user)\n  await refreshSession(session.id)\n  return session\n}\n```\n\nThe test passes 50 runs out of 50. Worth a look next: `refresh.ts` uses the same pattern for token rotation.",
    22,
  )
  at(200, { type: "turn-end", id: turn })
  return cues
}

/* Events that carry a timestamp: the ones that open or close something. */
const timed = (event: ThreadEvent) => event.type === "user" || /-(start|end)$/.test(event.type)

/** The finished turn, for examples that start already settled. */
export function demoMessages(turn = "demo"): ThreadMessage[] {
  const base = Date.UTC(2026, 9, 1, 9, 41)
  return reduceThreadBatch(
    [],
    demoScript(turn).map(({ at, event }) => (timed(event) ? { ...event, at: base + at } : event) as ThreadEvent),
  )
}

<p align="center">
  <img src=".github/assets/hero-light.png#gh-light-mode-only" alt="Opaline UI: an agent app with a streaming Agent Thread" width="100%" />
  <img src=".github/assets/hero-dark.png#gh-dark-mode-only" alt="Opaline UI: an agent app with a streaming Agent Thread" width="100%" />
</p>

# Opaline UI

React components for building agentic app interfaces.

At the centre is the **Agent Thread**, a conversation view for agents that work before they answer. Around it are the pieces every agent app needs: a composer, model and effort pickers, menus, dialogs, fields, switches, a command palette. They're built on Radix and drawn in one quiet set of materials.

```bash
npm install @opaline/ui
```

## Agent Thread

An agent's turn is two things: the **work** (thinking, searching, reading, running) and the **answer**. Most chat UIs stream them as one, and the answer ends up under forty tool calls.

Agent Thread keeps them apart. While the agent works, each step is one row: a mark you read before the words, a verb, a subject. When the answer starts, the work folds into a single line, *Worked for 14s*, and the reply gets the room.

```tsx
import { AgentThread } from "@opaline/ui/thread"

export function Chat() {
  const { messages, send, stop } = useYourAgent()
  return <AgentThread messages={messages} onSend={send} onStop={stop} />
}
```

- **Plain data in.** Pass an array of messages. No store, no backend, no provider lock-in.
- **Streaming.** Fold your agent's events into messages with `reduceThread`, or pass `useChat` from the Vercel AI SDK through `useAISDKThread`.
- **Tools that look right without setup.** `read_file`, `web_search`, `bash`, `mcp__github__create_pr` each get the right mark, verb and subject from their names. Register a tool to take over its title, subject, detail or body.
- **Configurable to the string.** Every label, the markdown renderer, the highlighter, the fold, the duration format.
- **Composable.** `<AgentThread>` is `Thread`, `ThreadViewport`, `ThreadMessages` and `Composer` wired together. Use the parts when you need something in between.
- **Model picker.** The composer's model, effort and context controls, with provider marks, search and keyboard shortcuts.

<p align="center">
  <img src=".github/assets/docs-thread.png" alt="The tools page of the Opaline docs" width="100%" />
</p>

### With the AI SDK

```tsx
import { useChat } from "@ai-sdk/react"
import { AgentThread, useAISDKThread } from "@opaline/ui/thread"

export function Chat() {
  const { messages, status, sendMessage, stop } = useChat()
  const thread = useAISDKThread(messages, status)
  return <AgentThread messages={thread} onSend={(text) => sendMessage({ text })} onStop={stop} />
}
```

### With your own agent loop

```tsx
import { AgentThread, reduceThread } from "@opaline/ui/thread"

const [messages, dispatch] = React.useReducer(reduceThread, [])

dispatch({ type: "tool-start", id: turn, callId, name: "read_file", input: { path } })
dispatch({ type: "tool-end", id: turn, callId, output })
dispatch({ type: "reply-start", id: turn })
dispatch({ type: "text-delta", id: turn, delta })
```

## Setup

Opaline is styled with Tailwind CSS v4. Import the stylesheet after Tailwind and let Tailwind scan the package:

```css
@import "tailwindcss";
@import "@opaline/ui/styles.css";

@source "../node_modules/@opaline/ui/dist";
```

Dark mode follows a `.dark` class or `data-theme="dark"` on any ancestor.

## Components

Alert, Badge, Button, Card, Collapsible, Command, Dialog, Dropdown Menu, Empty, Field, Hover Card, Input, Input Group, Kbd, Meter, Popover, Segmented, Select, Separator, Skeleton, Switch, Textarea, Toggle, Tooltip, View Switch.

```tsx
import { Button, Segmented, Switch } from "@opaline/ui"
```

## Theming

Everything reads CSS variables, named the way shadcn/ui names them. Change `--op-radius`, `--primary` or any other token under `:root` and `.dark`, and everything that reads it moves with it. Colour is reserved for verdicts: the palette is achromatic until something passes, slows down or fails.

## Development

```bash
npm install
npm run dev        # docs at http://localhost:3011
npm test           # thread reducer, adapter and tool inference
npm run build      # build @opaline/ui
```

| Path | |
| --- | --- |
| `packages/ui` | The library: `@opaline/ui` and `@opaline/ui/thread` |
| `apps/docs` | The docs site, on Fumadocs, with live examples |

## License

MIT

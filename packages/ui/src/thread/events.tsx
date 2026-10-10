/**
 * The thread's callbacks: everything a person can do in the transcript, handed
 * back to the host.
 *
 * The thread never acts on its own. It renders the messages it is given and
 * reports what the person did through these — the host decides what an edit,
 * a rating or an answer means and passes new messages back down. `<Thread>`
 * puts them in context; components deep in a turn read them with
 * `useThreadEvents`.
 */
import * as React from "react"
import type { AssistantMessage, QuestionAnswer } from "./types"

export type ThreadEvents = {
  /**
   * Shows "edit and run again" on user messages. Called with the new text; the
   * host rewinds the conversation to that message and runs it again. Hidden
   * while a turn is running and on pending messages.
   */
  onEdit?: (messageId: string, text: string) => void
  /**
   * Shows a rating menu on replies. `null` withdraws a rating. The footer
   * draws `message.rating`, so update it to light the thumb.
   */
  onRate?: (messageId: string, rating: "good" | "bad" | null) => void
  /** Replaces the default clipboard copy. */
  onCopy?: (text: string, messageId: string) => void
  /** Extra actions in a reply's footer. */
  renderActions?: (message: AssistantMessage) => React.ReactNode
  /** The person answered a `question` part. Answers line up with its questions. */
  onAnswer?: (partId: string, answers: QuestionAnswer[]) => void | Promise<void>
  /** The person declined a pending question. Shows a Skip control. */
  onCancelQuestion?: (partId: string) => void
  /**
   * Fetch a turn's deferred steps (`deferredSteps`) when its fold is opened.
   * Replace the message's `parts` and clear `deferredSteps` when they arrive;
   * reject to offer a retry.
   */
  onLoadWork?: (messageId: string) => void | Promise<void>
  /**
   * Where a pending question is answered. `"composer"` (default in
   * `AgentThread`) draws it in the composer's place; `"inline"` draws the
   * card in the transcript.
   */
  questionPlacement?: "composer" | "inline"
}

const Events = React.createContext<ThreadEvents>({})

export const ThreadEventsProvider = Events.Provider

export function useThreadEvents(): ThreadEvents {
  return React.useContext(Events)
}

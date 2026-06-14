import type { AgentSessionMessage, AgentSessionTimelineRow } from "./types";

export function buildAgentSessionTimeline(messages: AgentSessionMessage[]): AgentSessionTimelineRow[] {
  const rows: AgentSessionTimelineRow[] = [];
  let previousUserMessage = false;
  let previousAssistantPart = false;

  for (const message of messages) {
    if (message.role === "user") {
      rows.push({
        type: "user-message",
        id: `user-message:${message.id}`,
        message,
        previousUserMessage
      });
      previousUserMessage = true;
      previousAssistantPart = false;
      continue;
    }

    if (!message.parts?.length) {
      rows.push({
        type: "assistant-message",
        id: `assistant-message:${message.id}`,
        message,
        previousAssistantPart
      });
      previousAssistantPart = true;
      continue;
    }

    for (const part of message.parts) {
      if (part.type === "reasoning" && part.active) {
        rows.push({
          type: "thinking",
          id: `thinking:${message.id}:${part.id}`,
          messageId: message.id,
          label: part.label,
          summary: part.content
        });
        previousAssistantPart = true;
        continue;
      }

      rows.push({
        type: "assistant-part",
        id: `assistant-part:${message.id}:${part.id}`,
        messageId: message.id,
        part,
        previousAssistantPart
      });
      previousAssistantPart = true;
    }
  }

  return rows;
}

import type { HTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export type AgentSessionToolStatus = "pending" | "running" | "completed" | "error";

export type AgentSessionToolEntry = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  args?: ReactNode[];
  status?: AgentSessionToolStatus;
  content?: ReactNode;
  defaultOpen?: boolean;
};

export type AgentSessionActionEntry = {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  onSelect?: () => void;
};

export type AgentSessionMessagePart =
  | {
      type: "text";
      id: string;
      content: ReactNode;
      meta?: ReactNode;
    }
  | {
      type: "reasoning";
      id: string;
      label: ReactNode;
      content?: ReactNode;
      active?: boolean;
      defaultOpen?: boolean;
    }
  | {
      type: "context";
      id: string;
      activeLabel?: ReactNode;
      doneLabel?: ReactNode;
      summary?: ReactNode;
      entries: AgentSessionToolEntry[];
      active?: boolean;
      defaultOpen?: boolean;
    }
  | {
      type: "activity";
      id: string;
      entry: AgentRunTraceEntry;
      defaultOpen?: boolean;
    }
  | {
      type: "tool";
      id: string;
      tool: AgentSessionToolEntry;
    }
  | {
      type: "actions";
      id: string;
      content?: ReactNode;
      actions?: AgentSessionActionEntry[];
    };

export type AgentSessionMessage = {
  id: string;
  role: "user" | "assistant";
  content?: ReactNode;
  meta?: ReactNode;
  parts?: AgentSessionMessagePart[];
};

export type AgentSessionTimelineRow =
  | {
      type: "user-message";
      id: string;
      message: AgentSessionMessage;
      previousUserMessage: boolean;
    }
  | {
      type: "assistant-part";
      id: string;
      messageId: string;
      part: AgentSessionMessagePart;
      previousAssistantPart: boolean;
    }
  | {
      type: "assistant-message";
      id: string;
      message: AgentSessionMessage;
      previousAssistantPart: boolean;
    }
  | {
      type: "thinking";
      id: string;
      messageId: string;
      label: ReactNode;
      summary?: ReactNode;
    };

export type AgentSessionSurfaceProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  eyebrow?: ReactNode;
  title?: ReactNode;
  lead?: ReactNode;
  messages: AgentSessionMessage[];
  rows?: AgentSessionTimelineRow[];
  composer?: ReactNode;
  emptyState?: ReactNode;
  showReasoningSummaries?: boolean;
  scrollKey?: string | number;
};

export type AgentSessionTimelineProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  header?: ReactNode;
  messages: AgentSessionMessage[];
  rows?: AgentSessionTimelineRow[];
  emptyState?: ReactNode;
  showReasoningSummaries?: boolean;
  scrollKey?: string | number;
};

export type AgentSessionComposerProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onSubmit"> & {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: ReactNode;
  footerStart?: ReactNode;
  pending?: boolean;
  disabled?: boolean;
};

export type AgentSessionDockAction = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  variant?: "default" | "secondary" | "ghost" | "destructive";
  onSelect: () => void;
};

export type AgentSessionDockProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  preview?: ReactNode;
  actions?: AgentSessionDockAction[];
  defaultCollapsed?: boolean;
  children?: ReactNode;
};

export type AgentRunTraceEntry = {
  id: string;
  kind: "thought" | "tool";
  title: string;
  subtitle?: string;
  status?: AgentSessionToolStatus;
  icon?: "read" | "search" | "file" | "terminal" | "memory" | "tool";
  input?: string;
  output?: string;
};

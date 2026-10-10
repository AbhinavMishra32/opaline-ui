import type { ModelProvider } from "@opaline/ui/thread"

/** A plausible set of providers for the demos. */
export const providers: ModelProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      { id: "claude-opus-5-5", name: "Opus 5.5", description: "Most capable", reasoning: true },
      { id: "claude-sonnet-5", name: "Sonnet 5", description: "Fast and balanced", reasoning: true },
      { id: "claude-haiku-4-5", name: "Haiku 4.5", description: "Quickest" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-5-5", name: "GPT-5.5", reasoning: true },
      { id: "gpt-5-4-mini", name: "GPT-5.4 mini" },
    ],
  },
  {
    id: "google",
    name: "Google",
    models: [
      { id: "gemini-3-pro", name: "Gemini 3 Pro", reasoning: true },
      { id: "gemini-3-flash", name: "Gemini 3 Flash" },
    ],
  },
  { id: "ollama", name: "Ollama", models: [{ id: "qwen3-coder", name: "Qwen3 Coder" }] },
]

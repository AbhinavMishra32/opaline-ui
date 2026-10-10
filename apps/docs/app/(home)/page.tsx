import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { HeroWindow } from "@/components/hero-window"
import { Showcase } from "@/components/showcase"

const features = [
  {
    title: "Built to be read",
    body: "Work folds away when the answer starts. Every step is one quiet row with a mark you read before the words, and the reply gets the room.",
  },
  {
    title: "Configurable to the string",
    body: "A tool registry for how each call draws, every label replaceable, your own markdown and highlighter, and compound parts when the whole thing is too much.",
  },
  {
    title: "Any agent, any stream",
    body: "Plain data in. Fold your own events through reduceThread, or hand it useChat messages from the AI SDK. No provider lock-in, no backend.",
  },
]

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 pb-10 text-center sm:pt-24">
        <Link
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-ui-sm text-muted-foreground transition-colors hover:text-foreground"
          href="/docs/agent-thread"
        >
          <span className="size-1.5 rounded-full bg-success" />
          Agent Thread is here
          <ArrowRight className="size-3" />
        </Link>
        <h1 className="hero-title max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
          The UI kit for agentic apps
        </h1>
        <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-pretty text-muted-foreground">
          Opaline UI is a set of React components for building agent interfaces: a thread that shows the work and gets out of the way of the answer, and every control around it.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-ui font-medium text-primary-foreground transition-opacity hover:opacity-90"
            href="/docs"
          >
            Get started <ArrowRight className="size-3.5" />
          </Link>
          <code className="inline-flex h-9 items-center rounded-lg border bg-card px-3 font-mono text-ui-sm text-muted-foreground">
            npm i @opaline/ui
          </code>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4">
        <HeroWindow />
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-20 sm:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title}>
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">{feature.title}</h2>
            <p className="mt-2 text-ui leading-relaxed text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Everything around the thread</h2>
            <p className="mt-1 text-ui text-muted-foreground">Model pickers, permission prompts, settings, palettes: thirty primitives on Radix in the same materials.</p>
          </div>
          <Link className="shrink-0 text-ui text-muted-foreground hover:text-foreground" href="/docs/components/button">
            Browse components →
          </Link>
        </div>
        <Showcase />
      </section>
    </main>
  )
}

import fs from "node:fs/promises"
import path from "node:path"
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { cn } from "@opaline/ui"
import { Example } from "@/examples"

/**
 * A live example and its source, side by side in tabs. The source is the
 * example file itself, read at build time, so what the page shows is exactly
 * what runs: there is no second copy of the code to drift.
 */
export async function ComponentPreview({
  name,
  height,
  align = "center",
  className,
}: {
  name: string
  /** Fixed height for examples that fill their frame, like a thread. */
  height?: number
  align?: "center" | "start" | "stretch"
  className?: string
}) {
  const code = await fs.readFile(path.join(process.cwd(), "examples", `${name}.tsx`), "utf8")
  return (
    <Tabs className="not-prose my-6" items={["Preview", "Code"]}>
      <Tab className="p-0" value="Preview">
        <div
          className={cn(
            "dot-grid flex min-h-56 w-full overflow-hidden rounded-[inherit] bg-background",
            align === "center" && "items-center justify-center p-8",
            align === "start" && "items-start justify-center p-8",
            align === "stretch" && "flex-col",
            className,
          )}
          style={height ? { height } : undefined}
        >
          <Example name={name} />
        </div>
      </Tab>
      <Tab className="p-0" value="Code">
        <ServerCodeBlock code={code.trimEnd()} codeblock={{ className: "my-0 rounded-none border-0", viewportProps: { className: "max-h-[32rem]" } }} lang="tsx" />
      </Tab>
    </Tabs>
  )
}

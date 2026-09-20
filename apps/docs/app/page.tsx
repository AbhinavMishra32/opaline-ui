import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CopyIcon, GithubIcon, Layers3Icon, SparklesIcon } from "lucide-react";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Separator } from "@opaline/ui";

const principles = [
  ["Source first", "Install the code, keep ownership, change it without negotiating a package abstraction."],
  ["Quiet density", "Compact controls and calm hierarchy for software people use for hours, not screenshots."],
  ["One visual grammar", "The same radii, type, surfaces, focus, and motion from a tiny button to an agent workspace."],
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[48rem]" />
      <nav className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="opaline-lockup"><span className="opaline-mark"><i /><i /><i /></span>Opaline</Link>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm"><Link href="/docs">Docs</Link></Button>
          <Button asChild variant="ghost" size="icon-sm"><a href="https://github.com/AbhinavMishra32/opaline-ui" aria-label="GitHub"><GithubIcon /></a></Button>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-14 px-5 pt-20 pb-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pt-28">
        <div className="max-w-xl">
          <Badge variant="outline" className="mb-5"><SparklesIcon />Built from Spar</Badge>
          <h1 className="text-balance text-[clamp(3.2rem,7vw,6.3rem)] leading-[0.9] font-semibold tracking-[-0.065em]">UI that feels considered.</h1>
          <p className="mt-7 max-w-lg text-balance text-lg leading-7 text-muted-foreground">A source-first React component system distilled from Spar’s desktop interface—warm, precise, compact, and made for ambitious product software.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild size="lg"><Link href="/docs/getting-started/installation">Get started <ArrowRightIcon data-icon="inline-end" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/docs/components">Browse components</Link></Button>
          </div>
          <div className="mt-5 flex items-center gap-2 font-mono text-xs text-muted-foreground"><CopyIcon className="size-3.5" /> npx shadcn@latest add AbhinavMishra32/opaline-ui/button</div>
        </div>

        <div className="preview-stage opaline-surface relative min-h-[32rem] overflow-hidden rounded-2xl p-5 shadow-float sm:p-8">
          <div className="absolute inset-x-0 top-0 flex h-11 items-center gap-2 border-b border-border/70 px-4">
            <span className="size-2.5 rounded-full bg-foreground/15" /><span className="size-2.5 rounded-full bg-foreground/10" /><span className="size-2.5 rounded-full bg-foreground/10" />
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">opaline / preview</span>
          </div>
          <div className="mx-auto mt-14 max-w-sm">
            <Card>
              <CardHeader><div className="mb-2 flex items-center justify-between"><Badge variant="muted">Workspace</Badge><Layers3Icon className="size-4 text-muted-foreground" /></div><CardTitle>Start with the system</CardTitle><CardDescription>Small primitives carry the same visual decisions as the full product.</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Input aria-label="Workspace name" placeholder="Name your workspace" defaultValue="First light" />
                <div className="rounded-lg border bg-background/45 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium"><span className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground"><CheckIcon className="size-3" /></span>Theme and tokens installed</div>
                  <Separator className="my-3" />
                  <p className="text-xs leading-5 text-muted-foreground">Geist type, neutral OKLCH color, hairline borders, layered glass, and compact control geometry.</p>
                </div>
              </CardContent>
              <CardFooter className="justify-end"><Button variant="ghost" size="sm">Not now</Button><Button size="sm">Create workspace</Button></CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative border-t border-border/60 bg-background/55">
        <div className="mx-auto grid max-w-6xl gap-px bg-border/60 sm:grid-cols-3">
          {principles.map(([title, body]) => <div key={title} className="bg-background px-6 py-10 sm:px-8"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></div>)}
        </div>
      </section>
    </main>
  );
}

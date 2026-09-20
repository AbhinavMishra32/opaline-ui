"use client";

import { BellIcon, CheckIcon, CopyIcon, PlusIcon, Settings2Icon } from "lucide-react";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, Separator, Switch, Textarea, Tooltip, TooltipContent, TooltipKeys, TooltipProvider, TooltipTrigger } from "@opaline/ui";

const previews = {
  button: <div className="flex flex-wrap items-center gap-2"><Button><PlusIcon data-icon="inline-start" />New task</Button><Button variant="outline">Open</Button><Button variant="ghost" size="icon"><Settings2Icon /><span className="sr-only">Settings</span></Button><Button variant="destructive">Delete</Button></div>,
  badge: <div className="flex flex-wrap items-center gap-2"><Badge>Active</Badge><Badge variant="secondary">Draft</Badge><Badge variant="outline">v0.1</Badge><Badge variant="muted">Queued</Badge></div>,
  card: <Card className="w-full max-w-sm"><CardHeader><CardTitle>Ship the foundation</CardTitle><CardDescription>Keep the first layer small and coherent.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-2 text-sm"><span className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground"><CheckIcon className="size-3" /></span>9 primitives documented</div></CardContent><CardFooter><Button size="sm">Continue</Button></CardFooter></Card>,
  input: <div className="flex w-full max-w-sm flex-col gap-3"><Input aria-label="Workspace name" placeholder="Workspace name" /><Textarea aria-label="Workspace note" placeholder="Add a short note…" /></div>,
  switch: <div className="flex w-full max-w-sm items-center justify-between rounded-xl border bg-card/70 p-4"><div><div className="text-sm font-medium">Notifications</div><div className="mt-0.5 text-xs text-muted-foreground">Only when your agent needs attention.</div></div><Switch defaultChecked /></div>,
  tooltip: <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon"><BellIcon /><span className="sr-only">Notifications</span></Button></TooltipTrigger><TooltipContent>Notifications <TooltipKeys>⌘N</TooltipKeys></TooltipContent></Tooltip></TooltipProvider>,
  dialog: <Dialog><DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create workspace</DialogTitle><DialogDescription>Give the workspace a name. You can change it later.</DialogDescription></DialogHeader><Input aria-label="Workspace name" defaultValue="First light" /><DialogFooter><Button variant="ghost">Cancel</Button><Button>Create</Button></DialogFooter></DialogContent></Dialog>,
  separator: <div className="w-full max-w-sm rounded-xl border bg-card/70 p-4"><div className="text-sm font-medium">Interface foundation</div><Separator className="my-3" /><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Theme</span><span>Ready</span></div></div>,
} as const;

export function ComponentPreview({ name }: { name: keyof typeof previews }) {
  return <div className="preview-stage my-6 flex min-h-56 items-center justify-center rounded-xl border p-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.5)]">{previews[name]}</div>;
}

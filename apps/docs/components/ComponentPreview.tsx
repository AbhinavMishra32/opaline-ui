"use client";

import { useState } from "react";
import { Bookmark, Check, Clock, FileCode2, Folder, Settings, Terminal } from "lucide-react";
import {
  AdaptiveSidecarLayout,
  AdaptiveSidecarSurface,
  AgentSessionSurface,
  AppShell,
  AgentActivity,
  AgentSuggestion,
  BottomPanel,
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  FileTree,
  HoverPreview,
  IconButton,
  Input,
  SettingsCard,
  SettingsPanel,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
  SettingsToggle,
  ShadcnDialog,
  ShadcnDialogContent,
  ShadcnDialogDescription,
  ShadcnDialogFooter,
  ShadcnDialogHeader,
  ShadcnDialogTitle,
  ShadcnDialogTrigger,
  ShadcnDropdownMenu,
  ShadcnDropdownMenuContent,
  ShadcnDropdownMenuItem,
  ShadcnDropdownMenuSeparator,
  ShadcnDropdownMenuTrigger,
  Sidebar,
  SidebarSection,
  SlotPanel,
  TerminalSurface,
  Timeline,
  useShellHistory,
} from "@opaline/ui";
import type { FileTreeItem, ShellHistoryEntry, SidebarProject, TimelineItem } from "@opaline/ui";

type PreviewName =
  | "agent-activity"
  | "adaptive-sidecar"
  | "app-shell"
  | "buttons"
  | "composer"
  | "context-menu"
  | "dialog"
  | "dropdown-menu"
  | "file-tree"
  | "hover-preview"
  | "settings"
  | "shell-history"
  | "sidebar"
  | "slot-panel"
  | "timeline";

const projects: SidebarProject[] = [
  {
    id: "opaline",
    label: "opaline",
    threads: [
      { active: true, id: "docs", meta: "⌘1", title: "Rebuild component docs" },
      { id: "history", meta: "⌘2", title: "Design shell history" },
    ],
  },
];

const files: FileTreeItem[] = [
  {
    name: "packages",
    path: "packages",
    type: "directory",
    children: [
      {
        name: "ui",
        path: "packages/ui",
        type: "directory",
        children: [
          { gitStatus: "modified", name: "AppShell.tsx", path: "packages/ui/src/app-shell/AppShell.tsx" },
          { name: "Timeline.tsx", path: "packages/ui/src/timeline/Timeline.tsx" },
        ],
      },
    ],
  },
  { gitStatus: "modified", name: "README.md", path: "README.md", selected: true },
];

const snippets: Record<PreviewName, string> = {
  "adaptive-sidecar": `import { AdaptiveSidecarLayout, AdaptiveSidecarSurface } from "@opaline/ui";

<AdaptiveSidecarLayout
  open={open}
  pinned={pinned}
  sidecar={
    <AdaptiveSidecarSurface
      eyebrow="Knowledge"
      title="Runtime validation"
      pinned={pinned}
      onPinnedChange={setPinned}
      onClose={() => setOpen(false)}
    >
      Model-generated arguments remain untrusted until the runtime validates them.
    </AdaptiveSidecarSurface>
  }
>
  <Workspace />
</AdaptiveSidecarLayout>`,
  "agent-activity": `import { AgentActivity, AgentSuggestion } from "@opaline/ui";

<AgentActivity
  status="active"
  label="Checking project structure"
  detail="Building a recoverable block tree"
  entries={activity}
/>
<AgentSuggestion title="Split the large edit" onAction={applyPatch} />`,
  "app-shell": `import { AppShell, Sidebar, Input } from "@opaline/ui";

<AppShell
  sidebar={<Sidebar projects={projects} items={[]} />}
  main={<Workspace />}
  composer={<div className="border-t p-3"><Input placeholder="Ask the agent..." /></div>}
  rightPanel={<Inspector />}
  bottomPanel={<TerminalPanel />}
/>`,
  buttons: `import { Button, IconButton } from "@opaline/ui";

<Button variant="primary">Create project</Button>
<Button variant="secondary">Review changes</Button>
<IconButton aria-label="Settings"><Settings /></IconButton>`,
  composer: `import { Input } from "@opaline/ui";

<div className="border-t p-3">
  <Input placeholder="Ask the agent to inspect this workspace..." />
</div>`,
  "context-menu": `import { ContextMenu, ContextMenuContent, ContextMenuItem } from "@opaline/ui";

<ContextMenu>
  <ContextMenuTrigger>Right-click this surface</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Open in new tab</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  dialog: `import { ShadcnDialog, ShadcnDialogContent, ShadcnDialogTrigger } from "@opaline/ui";

<ShadcnDialog>
  <ShadcnDialogTrigger render={<Button>Open dialog</Button>} />
  <ShadcnDialogContent>...</ShadcnDialogContent>
</ShadcnDialog>`,
  "dropdown-menu": `import { ShadcnDropdownMenu, ShadcnDropdownMenuContent, ShadcnDropdownMenuItem } from "@opaline/ui";

<ShadcnDropdownMenu>
  <ShadcnDropdownMenuTrigger render={<Button>Open menu</Button>} />
  <ShadcnDropdownMenuContent><ShadcnDropdownMenuItem>Rename</ShadcnDropdownMenuItem></ShadcnDropdownMenuContent>
</ShadcnDropdownMenu>`,
  "file-tree": `import { FileTree } from "@opaline/ui";

<FileTree items={workspaceFiles} onSelect={(file) => openFile(file.path)} />`,
  "hover-preview": `import { HoverPreview } from "@opaline/ui";

<HoverPreview content={<ProjectSummary />}>
  <button>opaline</button>
</HoverPreview>`,
  settings: `import { SettingsPanel, SettingsRow, SettingsToggle } from "@opaline/ui";

<SettingsPanel title="Editor">
  <SettingsRow title="Format on save" control={<SettingsToggle checked />} />
</SettingsPanel>`,
  "shell-history": `const history = useShellHistory([
  { id: "thread:docs", type: "thread", title: "Docs" },
]);

history.push({ id: "file:button", type: "file", title: "Button.tsx" });
history.goBack();`,
  sidebar: `import { Sidebar, SidebarSection } from "@opaline/ui";

<Sidebar projects={projects} items={navigation}>
  <SidebarSection heading="Files"><FileTree items={files} /></SidebarSection>
</Sidebar>`,
  "slot-panel": `import { SlotPanel } from "@opaline/ui";

<SlotPanel
  keepMounted
  tabs={[{ id: "terminal", title: "Terminal", content: <Terminal /> }]}
/>`,
  timeline: `import { Timeline } from "@opaline/ui";

<Timeline items={milestones} density="compact" />`,
};

export function ComponentPreview({ name, slug }: { name?: PreviewName; slug?: PreviewName }) {
  const previewName = name ?? slug;
  const [view, setView] = useState<"preview" | "code">("preview");

  if (!previewName) return null;

  return (
    <div className="docs-live-preview">
      <div className="docs-preview-toolbar" role="tablist" aria-label={`${previewName} example`}>
        <button className="docs-preview-tab" data-active={view === "preview"} type="button" onClick={() => setView("preview")}>Preview</button>
        <button className="docs-preview-tab" data-active={view === "code"} type="button" onClick={() => setView("code")}>Code</button>
      </div>
      {view === "preview" ? renderPreview(previewName) : <pre className="docs-preview-code"><code>{snippets[previewName]}</code></pre>}
    </div>
  );
}

function renderPreview(name: PreviewName) {
  switch (name) {
    case "adaptive-sidecar":
      return <AdaptiveSidecarDemo />;
    case "agent-activity":
      return <PreviewStage><div className="docs-agent-activity-demo"><AgentActivity status="active" label="Checking project structure" detail="Building a recoverable block tree" defaultOpen entries={[{ id: "read", title: "Read project tape", detail: "3,406 tokens", status: "complete" }, { id: "grammar", title: "Check tape-0.3 grammar", detail: "Applying deterministic repairs", status: "active" }, { id: "review", title: "Prepare optional suggestions", status: "pending" }]} /><AgentSuggestion title="Add a concept card" description="The recall uses WebAuthn before it is introduced." actionLabel="Apply" onAction={() => undefined} /></div></PreviewStage>;
    case "buttons":
      return <PreviewStage><div className="docs-button-row"><Button variant="primary">Create project</Button><Button variant="secondary">Review changes</Button><Button variant="soft">Later</Button><Button variant="danger">Delete</Button><IconButton aria-label="Settings"><Settings size={16} /></IconButton></div></PreviewStage>;
    case "dropdown-menu":
      return <PreviewStage><ShadcnDropdownMenu><ShadcnDropdownMenuTrigger render={<Button variant="secondary">Open menu</Button>} /><ShadcnDropdownMenuContent><ShadcnDropdownMenuItem>Pin thread</ShadcnDropdownMenuItem><ShadcnDropdownMenuItem>Rename</ShadcnDropdownMenuItem><ShadcnDropdownMenuSeparator /><ShadcnDropdownMenuItem>Copy link</ShadcnDropdownMenuItem></ShadcnDropdownMenuContent></ShadcnDropdownMenu></PreviewStage>;
    case "context-menu":
      return <PreviewStage><ContextMenu><ContextMenuTrigger render={<button className="opaline-button opaline-button-secondary" type="button">Right-click this surface</button>} /><ContextMenuContent><ContextMenuItem>Open in new tab</ContextMenuItem><ContextMenuItem>Reveal in file tree</ContextMenuItem><ContextMenuSeparator /><ContextMenuItem>Copy path</ContextMenuItem></ContextMenuContent></ContextMenu></PreviewStage>;
    case "dialog":
      return <PreviewStage><ShadcnDialog><ShadcnDialogTrigger render={<Button variant="primary">Open dialog</Button>} /><ShadcnDialogContent><ShadcnDialogHeader><ShadcnDialogTitle>Create workspace</ShadcnDialogTitle></ShadcnDialogHeader><div className="p-4">Choose a directory and Opaline will keep the shell state caller-owned.</div><ShadcnDialogFooter><Button variant="secondary">Cancel</Button><Button variant="primary">Create</Button></ShadcnDialogFooter></ShadcnDialogContent></ShadcnDialog></PreviewStage>;
    case "hover-preview":
      return <PreviewStage><HoverPreview content={<div className="docs-hover-card"><strong>Opaline documentation</strong><span>Next.js, Fumadocs, MDX, and live package source.</span></div>}><Button variant="secondary">Hover for context</Button></HoverPreview></PreviewStage>;
    case "timeline":
      return <PreviewStage><div className="docs-timeline-demo"><Timeline items={timelineItems} density="compact" /></div></PreviewStage>;
    case "shell-history":
      return <HistoryDemo />;
    case "settings":
      return <SettingsDemo />;
    case "sidebar":
      return <PreviewStage size="wide"><div className="docs-sidebar-demo"><Sidebar projects={projects} items={[{ id: "components", title: "Component registry", meta: "24" }]}><SidebarSection heading="Workspace"><FileTree items={files} variant="sidebar" /></SidebarSection></Sidebar></div></PreviewStage>;
    case "file-tree":
      return <PreviewStage size="wide"><div className="docs-sidebar-demo"><FileTree items={files} /></div></PreviewStage>;
    case "composer":
      return <PreviewStage><div className="docs-composer-demo border-t p-3"><Input placeholder="Ask the agent to inspect this workspace..." /></div></PreviewStage>;
    case "slot-panel":
      return <PreviewStage size="wide"><SlotPanel tabs={[{ id: "terminal", title: "Terminal", icon: <Terminal size={14} />, content: <TerminalSurface cwd="~/opaline">npm run docs:dev</TerminalSurface> }, { id: "files", title: "Files", icon: <Folder size={14} />, content: <FileTree items={files} /> }]} onClose={() => undefined} /></PreviewStage>;
    case "app-shell":
      return <ShellDemo />;
  }
}

function AdaptiveSidecarDemo() {
  const [open, setOpen] = useState(true);
  const [pinned, setPinned] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="docs-preview-stage docs-sidecar-stage" data-size="wide">
      <AdaptiveSidecarLayout
        open={open}
        pinned={pinned}
        className="docs-sidecar-layout"
        sidecar={(
          <AdaptiveSidecarSurface
            eyebrow="Knowledge"
            title="Runtime validation"
            collapsed={collapsed}
            pinned={pinned}
            onCollapsedChange={setCollapsed}
            onPinnedChange={setPinned}
            onClose={() => setOpen(false)}
            footer={<Button variant="secondary" onClick={() => setOpen(false)}><Bookmark size={14} /> Save concept</Button>}
          >
            <p>Model-generated arguments remain untrusted until the runtime validates them against an executable schema.</p>
            <hr />
            <strong>Why it matters</strong>
            <p>The schema is the boundary between probabilistic model output and real application code.</p>
          </AdaptiveSidecarSurface>
        )}
      >
        <div className="docs-sidecar-workspace">
          <span>Workspace</span>
          <h3>Validated tool contracts</h3>
          <p>The main surface shifts only when enough room exists. Narrow layouts use an overlay automatically.</p>
          {!open ? <Button variant="primary" onClick={() => setOpen(true)}>Open knowledge</Button> : null}
        </div>
      </AdaptiveSidecarLayout>
    </div>
  );
}

function PreviewStage({ children, size }: { children: React.ReactNode; size?: "wide" }) {
  return <div className="docs-preview-stage" data-size={size}>{children}</div>;
}

function HistoryDemo() {
  const history = useShellHistory<ShellHistoryEntry>([
    { id: "thread:docs", type: "thread", title: "Docs architecture" },
    { id: "file:button", type: "file", title: "Button.tsx" },
  ]);

  return (
    <PreviewStage>
      <div className="docs-history-demo">
        <div className="docs-button-row">
          <Button disabled={!history.canGoBack} onClick={history.goBack}>Back</Button>
          <Button disabled={!history.canGoForward} onClick={history.goForward}>Forward</Button>
          <Button variant="primary" onClick={() => history.push({ id: `settings:${history.entries.length}`, type: "settings", title: "Settings" })}>Push settings</Button>
        </div>
        <p>Current: <strong>{history.current?.title}</strong></p>
        <code>{history.entries.map((entry) => entry.title).join(" → ")}</code>
      </div>
    </PreviewStage>
  );
}

function SettingsDemo() {
  const [enabled, setEnabled] = useState(true);
  const [tabSize, setTabSize] = useState("2");
  return (
    <div className="docs-preview-stage" data-size="wide">
      <div className="docs-settings-demo">
        <SettingsPanel title="Editor" subtitle="Workspace defaults for code editing.">
          <SettingsSection title="Behavior"><SettingsCard><SettingsRow title="Format on save" description="Run the configured formatter after writes." control={<SettingsToggle checked={enabled} onCheckedChange={setEnabled} />} /><SettingsRow title="Tab size" control={<SettingsSelect value={tabSize} onValueChange={setTabSize} options={[{ label: "2 spaces", value: "2" }, { label: "4 spaces", value: "4" }]} />} /></SettingsCard></SettingsSection>
        </SettingsPanel>
      </div>
    </div>
  );
}

function ShellDemo() {
  return (
    <div className="docs-preview-stage" data-size="shell">
      <div className="docs-shell-demo">
        <AppShell
          headerTabs={[{ active: true, id: "docs", title: "Opaline docs" }, { id: "button", title: "Button.tsx", dirty: true }]}
          sidebar={<Sidebar projects={projects} items={[]}><SidebarSection heading="Files"><FileTree items={files} variant="sidebar" /></SidebarSection></Sidebar>}
          main={<AgentSessionSurface title="Rebuild component docs" lead="Live workspace package" messages={[{ id: "msg-1", role: "assistant", content: "The docs render Opaline directly from packages/ui/src, so component changes appear without publishing or rebuilding the package." }, { id: "msg-2", role: "user", content: "Make every example interactive and explain the systems behind the shell." }]} />}
          composer={<div className="border-t p-3"><Input placeholder="Ask about the component system..." /></div>}
          rightPanel={<FileTree items={files} />}
          bottomPanel={<BottomPanel tabs={[{ id: "terminal", title: "Terminal", active: true, content: <TerminalSurface cwd="~/opaline">npm run docs:dev</TerminalSurface> }]} />}
        />
      </div>
    </div>
  );
}

const timelineItems: TimelineItem[] = [
  { id: "contract", title: "Component contract", description: "Caller-owned state and content slots are defined.", status: "completed", icon: <Check size={12} />, meta: "09:42" },
  { id: "preview", title: "Interactive preview", description: "The real package export is mounted in MDX.", status: "active", icon: <Clock size={12} />, meta: "now" },
  { id: "publish", title: "Publish package", description: "Release when the API and docs agree.", status: "pending", icon: <FileCode2 size={12} /> },
];

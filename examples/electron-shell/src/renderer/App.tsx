import {
  Archive,
  Box,
  ChevronDown,
  Code2,
  Ellipsis,
  File as FileIcon,
  Gauge,
  GitBranch,
  Globe,
  Keyboard,
  ListTree,
  Monitor,
  PanelBottom,
  PanelRight,
  Palette,
  Plug,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  SquarePen,
  Terminal as TerminalIcon,
  UserCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AgentSessionSurface,
  AppShell,
  AppShellHeaderPillButton,
  AppShellHeaderToolButton,
  BottomPanel,
  Button,
  FileTree,
  Input,
  OpalineMark,
  SettingsCard,
  SettingsOptionCard,
  SettingsPanel,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
  SettingsSidebar,
  SettingsToggle,
  ShadcnDialog,
  ShadcnDialogContent,
  ShadcnDialogDescription,
  ShadcnDialogFooter,
  ShadcnDialogHeader,
  ShadcnDialogTitle,
  ShadcnDialogTrigger,
  Sidebar,
  TerminalSurface,
  useShellHistory,
} from "@opaline/ui";
import type {
  SettingsNavItem,
  SettingsNavSection,
  ShellHistoryEntry,
  SidebarItem,
  SidebarNavItem,
  SidebarProject,
  SlotTab,
  TreeNode,
} from "@opaline/ui";
import "@opaline/ui/styles.css";
import "./app.css";

const baseThreads: SidebarItem[] = [];

const baseProjects: SidebarProject[] = [
  {
    id: "project-desktop-agent-app",
    label: "desktop-agent-app",
    active: true,
    threads: [{ id: "thread-inspect-electron-ui", title: "Inspect Electron UI", meta: "⌘1", active: true }],
  },
  {
    id: "project-application-agent",
    label: "application-agent",
    threads: [{ id: "thread-fix-dev-db", title: "Fix dev and DB errors", meta: "⌘2" }],
  },
  {
    id: "project-fill-agent",
    label: "fill-agent",
    muted: true,
    threads: [
      { id: "thread-fill-agent-browser-use", title: "okay scrap this. lets use co...", meta: "⌘3" },
      { id: "thread-build-browser-extension", title: "Build agent browser extens...", meta: "⌘4" },
    ],
  },
  {
    id: "project-daytracker",
    label: "daytracker",
    muted: true,
    threads: [{ id: "thread-screenpipe-daytracker", title: "Research Screenpipe day t...", meta: "⌘5" }],
  },
  {
    id: "project-construct",
    label: "construct",
    threads: [
      { id: "thread-construct-architecture", title: "Inspect Electron app archit...", meta: "⌘6" },
      { id: "thread-dev-startup", title: "Fix dev startup failures", meta: "⌘7" },
      { id: "thread-fullstack-intern", title: "Find remote full-stack inter...", meta: "⌘8" },
      { id: "thread-dashboard-history", title: "Remove dashboard goal hi...", meta: "⌘9" },
      { id: "thread-top-bar", title: "Tighten top bar controls", meta: "2mo" },
      { id: "thread-show-more", title: "Show more" },
    ],
  },
];

const messages = [
  {
    id: "msg-1",
    role: "user" as const,
    content: "Strip out the component system and create a library component system from their code.",
  },
  {
    id: "msg-2",
    role: "assistant" as const,
    content:
      "The readable component library now carries Opaline shell/sidebar/composer/thread primitives plus recovered dialog, bottom panel, terminal, and file-tree systems.",
  },
];

const fileTreeItems = [
  {
    name: "opaline",
    path: "opaline",
    type: "directory" as const,
    children: [
      {
        name: "src",
        path: "opaline/packages/ui/src",
        type: "directory" as const,
        children: [
          {
            name: "lib",
            path: "opaline/packages/ui/src",
            type: "directory" as const,
            children: [
              { name: "Dialog.tsx", path: "packages/ui/src/primitives/Dialog.tsx", gitStatus: "added" as const },
              {
                name: "BottomPanel.tsx",
                path: "packages/ui/src/bottom-panel/BottomPanel.tsx",
                gitStatus: "added" as const,
              },
              { name: "FileTree.tsx", path: "packages/ui/src/file-tree/FileTree.tsx", gitStatus: "added" as const },
            ],
          },
          { name: "electron-shell", path: "examples/electron-shell/src/renderer", type: "directory" as const },
        ],
      },
      { name: "package.json", path: "package.json", gitStatus: "modified" as const, selected: true },
    ],
  },
];

const previewCode = `{
  "name": "@opaline/ui",
  "version": "0.3.0",
  "description": "Native-looking shell primitives for modern desktop apps.",
  "exports": {
    ".": "./dist/index.js",
    "./styles.css": "./dist/styles.css"
  }
}`;

const previewFiles = {
  "package.json": {
    breadcrumbs: ["opaline", "package.json"],
    code: previewCode,
    fileName: "package.json",
    language: "json",
  },
  "packages/ui/src/primitives/Dialog.tsx": {
    breadcrumbs: ["opaline", "packages", "ui", "src", "primitives", "Dialog.tsx"],
    code: `export function DialogContent() {
  return <div className="opaline-dialog-surface" />;
}`,
    fileName: "Dialog.tsx",
    language: "tsx",
  },
  "packages/ui/src/bottom-panel/BottomPanel.tsx": {
    breadcrumbs: ["opaline", "packages", "ui", "src", "bottom-panel", "BottomPanel.tsx"],
    code: `export function BottomPanel() {
  return <SlotPanel keepMounted />;
}`,
    fileName: "BottomPanel.tsx",
    language: "tsx",
  },
  "packages/ui/src/file-tree/FileTree.tsx": {
    breadcrumbs: ["opaline", "packages", "ui", "src", "file-tree", "FileTree.tsx"],
    code: `export function FileTree() {
  return <TreeView data={nodes} />;
}`,
    fileName: "FileTree.tsx",
    language: "tsx",
  },
} satisfies Record<string, { breadcrumbs: string[]; code: string; fileName: string; language: string }>;

type ExampleHistoryEntry = ShellHistoryEntry<
  "bottom-tab" | "file" | "settings" | "thread",
  { filePath?: string; settingsItemId?: string; tabId?: string; threadId?: string }
>;

const settingsSections: SettingsNavSection[] = [
  {
    id: "personal",
    label: "Personal",
    items: [
      { id: "general", label: "General", icon: <SettingsIcon size={18} strokeWidth={1.7} /> },
      { id: "profile", label: "Profile", icon: <UserCircle size={18} strokeWidth={1.7} /> },
      { id: "appearance", label: "Appearance", icon: <Palette size={18} strokeWidth={1.7} /> },
      { id: "configuration", label: "Configuration", icon: <ShieldCheck size={18} strokeWidth={1.7} /> },
      { id: "keyboard", label: "Keyboard shortcuts", icon: <Keyboard size={18} strokeWidth={1.7} /> },
      { id: "usage", label: "Usage & billing", icon: <Gauge size={18} strokeWidth={1.7} /> },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    items: [
      { id: "appshots", label: "Appshots", icon: <Box size={18} strokeWidth={1.7} /> },
      { id: "mcp", label: "MCP servers", icon: <Plug size={18} strokeWidth={1.7} /> },
      { id: "browser", label: "Browser", icon: <Globe size={18} strokeWidth={1.7} /> },
      { id: "computer-use", label: "Computer use", icon: <Monitor size={18} strokeWidth={1.7} /> },
    ],
  },
  {
    id: "coding",
    label: "Coding",
    items: [
      { id: "hooks", label: "Hooks", icon: <Code2 size={18} strokeWidth={1.7} /> },
      { id: "git", label: "Git", icon: <GitBranch size={18} strokeWidth={1.7} /> },
      { id: "archived", label: "Archived chats", icon: <Archive size={18} strokeWidth={1.7} /> },
    ],
  },
];

export function App() {
  const history = useShellHistory<ExampleHistoryEntry>(() => [
    createThreadHistoryEntry("thread-inspect-electron-ui", "Inspect Electron UI"),
  ]);
  const [currentThreadId, setCurrentThreadId] = useState("thread-inspect-electron-ui");
  const [activeBottomTabId, setActiveBottomTabId] = useState("terminal");
  const [selectedFilePath, setSelectedFilePath] = useState<keyof typeof previewFiles>("package.json");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsItemId, setSettingsItemId] = useState("general");
  const [settingsQuery, setSettingsQuery] = useState("");
  const [defaultPermissions, setDefaultPermissions] = useState(true);
  const [autoReview, setAutoReview] = useState(true);
  const [fullAccess, setFullAccess] = useState(true);
  const [workMode, setWorkMode] = useState<"coding" | "everyday">("coding");

  useEffect(() => {
    const current = history.current;
    if (current?.type === "thread" && current.payload?.threadId != null) {
      setIsSettingsOpen(false);
      setCurrentThreadId(current.payload.threadId);
    }
    if (current?.type === "bottom-tab" && current.payload?.tabId != null) {
      setIsSettingsOpen(false);
      setActiveBottomTabId(current.payload.tabId);
    }
    if (current?.type === "file" && current.payload?.filePath != null && current.payload.filePath in previewFiles) {
      setIsSettingsOpen(false);
      setSelectedFilePath(current.payload.filePath as keyof typeof previewFiles);
    }
    if (current?.type === "settings" && current.payload?.settingsItemId != null) {
      setIsSettingsOpen(true);
      setSettingsItemId(current.payload.settingsItemId);
    }
  }, [history.current]);

  const projects = useMemo<SidebarProject[]>(
    () =>
      baseProjects.map((project) => {
        const projectHasActiveThread = project.threads?.some((thread) => thread.id === currentThreadId) ?? false;
        return {
          ...project,
          active: projectHasActiveThread,
          threads: project.threads?.map((thread) => ({
            ...thread,
            active: thread.id === currentThreadId,
          })),
        };
      }),
    [currentThreadId],
  );

  const threads = useMemo<SidebarItem[]>(
    () =>
      baseThreads.map((thread) => ({
        ...thread,
        active: thread.id === currentThreadId,
      })),
    [currentThreadId],
  );

  const primaryItems = useMemo<SidebarNavItem[]>(
    () => [
      { id: "new-chat", label: "New chat", icon: <SquarePen size={18} strokeWidth={1.9} /> },
      { id: "search", label: "Search", icon: <Search size={18} strokeWidth={1.9} /> },
    ],
    [],
  );

  const activeThreadTitle =
    projects.flatMap((project) => project.threads ?? []).find((thread) => thread.id === currentThreadId)?.title ??
    "Inspect Electron UI";

  const openThread = useCallback(
    (threadId: string) => {
      const title =
        baseProjects.flatMap((project) => project.threads ?? []).find((thread) => thread.id === threadId)?.title ??
        threadId;
      setIsSettingsOpen(false);
      setCurrentThreadId(threadId);
      history.push(createThreadHistoryEntry(threadId, String(title)));
    },
    [history.push],
  );

  const openSettings = useCallback(
    (itemId = "general") => {
      const item = findSettingsItem(itemId);
      setIsSettingsOpen(true);
      setSettingsItemId(itemId);
      history.push({
        id: `settings:${itemId}`,
        payload: { settingsItemId: itemId },
        title: String(item?.label ?? "Settings"),
        type: "settings",
      });
    },
    [history.push],
  );

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    history.push(createThreadHistoryEntry(currentThreadId, String(activeThreadTitle)));
  }, [activeThreadTitle, currentThreadId, history.push]);

  const openFile = useCallback(
    (filePath: string) => {
      if (!(filePath in previewFiles)) {
        return;
      }
      const file = previewFiles[filePath as keyof typeof previewFiles];
      setIsSettingsOpen(false);
      setSelectedFilePath(filePath as keyof typeof previewFiles);
      history.push({
        id: `file:${filePath}`,
        payload: { filePath },
        title: file.fileName,
        type: "file",
      });
    },
    [history.push],
  );

  const handleFileTreeNodeClick = useCallback(
    (node: TreeNode) => {
      if (node.data?.type === "directory") {
        return;
      }
      if (typeof node.data?.path === "string") {
        openFile(node.data.path);
      }
    },
    [openFile],
  );

  const handleBottomTabChange = useCallback(
    (tabId: string | null, tab: SlotTab | null) => {
      if (tabId == null) {
        return;
      }
      setIsSettingsOpen(false);
      setActiveBottomTabId(tabId);
      history.push({
        id: `bottom-tab:${tabId}`,
        payload: { tabId },
        title: tab?.title ?? tabId,
        type: "bottom-tab",
      });
    },
    [history.push],
  );

  const bottomPanelTabs = useMemo<SlotTab[]>(
    () => [
      {
        active: true,
        closable: true,
        id: "terminal",
        title: "desktop-agent-app",
        icon: <TerminalIcon size={14} />,
        content: <TerminalSurface />,
      },
      {
        id: "files",
        title: "Open file",
        closable: true,
        icon: <FileIcon size={14} />,
        content: (
          <FileTree
            items={fileTreeItems}
            defaultExpandedIds={["opaline", "opaline/packages/ui/src", "opaline/packages/ui/src/lib"]}
            onNodeClick={handleFileTreeNodeClick}
          />
        ),
      },
    ],
    [handleFileTreeNodeClick],
  );

  const selectedFile = previewFiles[selectedFilePath];
  const activeSettingsItem = findSettingsItem(settingsItemId) ?? findSettingsItem("general");

  return (
    <AppShell
      history={history}
      headerTabs={
        isSettingsOpen
          ? [{ active: true, id: `settings-${settingsItemId}`, title: activeSettingsItem?.label ?? "Settings" }]
          : [
              { active: true, dirty: true, id: currentThreadId, title: activeThreadTitle },
              { id: "component-system", title: "Component system" },
            ]
      }
      headerActions={(shell) => (
        <>
          <AppShellHeaderPillButton type="button" aria-label="Current app">
            <span className="opaline-header-agent-icon" aria-hidden="true">
              <OpalineMark className="opaline-header-agent-mark" />
            </span>
            <ChevronDown size={18} strokeWidth={1.7} />
          </AppShellHeaderPillButton>
          <AppShellHeaderToolButton type="button" aria-label="Thread outline">
            <ListTree size={20} strokeWidth={1.7} />
          </AppShellHeaderToolButton>
          <AppShellHeaderToolButton
            type="button"
            onClick={shell.toggleBottomPanel}
            aria-label="Toggle bottom panel"
            data-active={shell.isBottomPanelOpen ? "true" : undefined}
          >
            <PanelBottom size={20} strokeWidth={1.7} />
          </AppShellHeaderToolButton>
          <AppShellHeaderToolButton
            type="button"
            onClick={shell.toggleRightPanel}
            aria-label="Toggle right panel"
            data-active={shell.isRightPanelOpen ? "true" : undefined}
          >
            <PanelRight size={20} strokeWidth={1.7} />
          </AppShellHeaderToolButton>
          <AppShellHeaderToolButton className="opaline-header-tool-button-plain" type="button" aria-label="More actions">
            <Ellipsis size={20} strokeWidth={1.7} />
          </AppShellHeaderToolButton>
        </>
      )}
      sidebar={
        isSettingsOpen ? (
          <SettingsSidebar
            activeItemId={settingsItemId}
            onBack={closeSettings}
            onItemSelect={(item: SettingsNavItem) => openSettings(item.id)}
            onSearchChange={setSettingsQuery}
            query={settingsQuery}
            sections={settingsSections}
          />
        ) : (
          <Sidebar
            footer={
              <button className="opaline-sidebar-settings" type="button" onClick={() => openSettings("general")}>
                <span className="opaline-sidebar-footer-icon" aria-hidden="true">
                  <SettingsIcon size={18} strokeWidth={1.7} />
                </span>
                <span>Settings</span>
              </button>
            }
            items={threads}
            primaryItems={primaryItems}
            projects={projects}
            renderItem={(item, options) => (
              <button
                className="opaline-sidebar-item"
                data-active={item.active === true ? "true" : undefined}
                data-inset={options.inset === true ? "true" : "false"}
                onClick={() => openThread(item.id)}
                type="button"
              >
                <span className="opaline-sidebar-item-title">{item.title}</span>
                {item.meta != null ? (
                  <span className="opaline-sidebar-item-meta" data-kind="shortcut">
                    {item.meta}
                  </span>
                ) : null}
              </button>
            )}
          />
        )
      }
      main={
        isSettingsOpen ? (
          <ExampleSettingsContent
            autoReview={autoReview}
            defaultPermissions={defaultPermissions}
            fullAccess={fullAccess}
            sectionTitle={String(activeSettingsItem?.label ?? "General")}
            setAutoReview={setAutoReview}
            setDefaultPermissions={setDefaultPermissions}
            setFullAccess={setFullAccess}
            setWorkMode={setWorkMode}
            workMode={workMode}
          />
        ) : (
          <div className="opaline-renderer-stack">
            <AgentSessionSurface title={String(activeThreadTitle)} lead="Component-system reconstruction" messages={messages} />
            <ShadcnDialog>
              <ShadcnDialogTrigger render={<Button variant="secondary">Open Opaline popup primitive</Button>} />
              <ShadcnDialogContent>
                <ShadcnDialogHeader>
                  <ShadcnDialogTitle>Opaline dialog primitive</ShadcnDialogTitle>
                  <ShadcnDialogDescription>Radix dialog behavior with the recovered Opaline overlay, surface, close button, sizes, and measured-height transition.</ShadcnDialogDescription>
                </ShadcnDialogHeader>
                <div className="p-4">
                  <p>This is the shared popup layer used as the readable target for upstream `dialog-layout-CCvvb1Vc.js`.</p>
                </div>
                <ShadcnDialogFooter>
                  <Button variant="secondary">Cancel</Button>
                  <Button variant="primary">Continue</Button>
                </ShadcnDialogFooter>
              </ShadcnDialogContent>
            </ShadcnDialog>
          </div>
        )
      }
      composer={isSettingsOpen ? undefined : <div className="border-t p-3"><Input placeholder="Ask Opaline to build, inspect, or recreate a component..." /></div>}
      rightPanel={
        isSettingsOpen ? undefined : (
          <div className="flex h-full flex-col overflow-hidden border-l bg-card">
            <div className="flex items-center gap-2 border-b px-3 py-2 text-sm">
              {selectedFile.breadcrumbs.map((crumb, i) => (
                <span key={i} className={i === selectedFile.breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"}>
                  {crumb}
                </span>
              ))}
            </div>
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <aside className="w-48 shrink-0 overflow-auto border-r p-2" data-app-shell-focus-area="file-tree">
                <FileTree
                  items={fileTreeItems}
                  defaultExpandedIds={["opaline", "opaline/packages/ui/src", "opaline/packages/ui/src/lib"]}
                  selectedIds={[selectedFilePath]}
                  onSelectionChange={() => undefined}
                  onNodeClick={handleFileTreeNodeClick}
                />
              </aside>
              <div className="min-w-0 flex-1 overflow-auto p-4">
                <pre className="text-sm">{selectedFile.code}</pre>
              </div>
            </div>
          </div>
        )
      }
      bottomPanel={
        isSettingsOpen
          ? undefined
          : (shell) => (
              <BottomPanel
                activeTabId={activeBottomTabId}
                keepMounted
                onActiveTabChange={handleBottomTabChange}
                onClose={shell.toggleBottomPanel}
                tabs={bottomPanelTabs}
              />
            )
      }
    />
  );
}

function createThreadHistoryEntry(threadId: string, title: string): ExampleHistoryEntry {
  return {
    id: `thread:${threadId}`,
    payload: { threadId },
    title,
    type: "thread",
  };
}

function ExampleSettingsContent({
  autoReview,
  defaultPermissions,
  fullAccess,
  sectionTitle,
  setAutoReview,
  setDefaultPermissions,
  setFullAccess,
  setWorkMode,
  workMode,
}: {
  autoReview: boolean;
  defaultPermissions: boolean;
  fullAccess: boolean;
  sectionTitle: string;
  setAutoReview: (value: boolean) => void;
  setDefaultPermissions: (value: boolean) => void;
  setFullAccess: (value: boolean) => void;
  setWorkMode: (value: "coding" | "everyday") => void;
  workMode: "coding" | "everyday";
}) {
  return (
    <SettingsPanel title={sectionTitle}>
      <SettingsSection>
        <div className="opaline-settings-work-mode-grid">
          <SettingsOptionCard
            description="More technical responses and control"
            icon={<TerminalIcon size={18} strokeWidth={1.7} />}
            onClick={() => setWorkMode("coding")}
            selected={workMode === "coding"}
            title="For coding"
          />
          <SettingsOptionCard
            description="Same power, less technical detail"
            icon={<Search size={18} strokeWidth={1.7} />}
            onClick={() => setWorkMode("everyday")}
            selected={workMode === "everyday"}
            title="For everyday work"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Permissions">
        <SettingsCard>
          <SettingsRow
            control={<SettingsToggle checked={defaultPermissions} onCheckedChange={setDefaultPermissions} />}
            description="By default, Opaline can read and edit files in its workspace. It can ask for additional access when needed."
            title="Default permissions"
          />
          <SettingsRow
            control={<SettingsToggle checked={autoReview} onCheckedChange={setAutoReview} />}
            description="Opaline automatically reviews requests for additional access. Auto-review can make mistakes."
            title="Auto-review"
          />
          <SettingsRow
            control={<SettingsToggle checked={fullAccess} onCheckedChange={setFullAccess} />}
            description="When Opaline runs with full access, it can edit any file on your computer and run commands with network."
            title="Full access"
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title="General">
        <SettingsCard>
          <SettingsRow
            control={
              <SettingsSelect defaultValue="ghostty" aria-label="Default open destination">
                <option value="ghostty">Ghostty</option>
                <option value="terminal">Terminal</option>
                <option value="editor">Editor</option>
              </SettingsSelect>
            }
            description="Where files and folders open by default"
            title="Default open destination"
          />
          <SettingsRow
            control={
              <SettingsSelect defaultValue="auto" aria-label="Language">
                <option value="auto">Auto Detect</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </SettingsSelect>
            }
            description="Language for the app UI"
            title="Language"
          />
        </SettingsCard>
      </SettingsSection>
    </SettingsPanel>
  );
}

function findSettingsItem(itemId: string) {
  return settingsSections.flatMap((section) => section.items).find((item) => item.id === itemId);
}

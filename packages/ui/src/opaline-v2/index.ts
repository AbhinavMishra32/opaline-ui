export {
  AppShell,
  AppShellBottomPanel,
  AppShellChromeButton,
  AppShellChromeControls,
  AppShellCollapsedSidebarTrigger,
  AppShellComposer,
  AppShellContent,
  AppShellHeader,
  AppShellHeaderActions,
  AppShellHeaderContextSurface,
  AppShellHeaderPillButton,
  AppShellHeaderToolButton,
  AppShellNavigationControls,
  AppShellRightPanel,
  AppShellSidebarChrome,
  AppShellTab,
  AppShellTabActionButton,
  AppShellTabActions,
  AppShellTabController,
  AppShellTabStrip,
  OpalineV2ChromeButton,
  OpalineV2CollapsedSidebarTrigger,
  OpalineV2HeaderTab,
  OpalineV2HeaderToolButton,
  OpalineV2InspectorIcon,
  OpalineV2NavigationControls,
  OpalineV2Shell,
  OpalineV2Sidebar,
  OpalineV2SidebarItemButton,
  ShellIconButton,
} from "./AppShell";
export { Button, IconButton, Pill, StatusDot } from "./Button";
export type { OpalineV2ButtonProps } from "./Button";
export { Alert, AlertDescription, AlertTitle, Badge, Input, Spinner, Textarea } from "../components";
export type {
  AppShellProps,
  AppShellState,
  AppShellTabItem,
  OpalineV2ShellButtonProps,
  OpalineV2ShellProps,
  OpalineV2ShellState,
  OpalineV2ShellTabItem,
  OpalineV2SidebarItem,
  OpalineV2SidebarProps,
  OpalineV2SidebarSection,
} from "./AppShell";
export { OpalineThemeProvider, useOpalineTheme } from "./Theme";
export type {
  OpalineResolvedTheme,
  OpalineTheme,
  OpalineThemeProviderProps,
  OpalineThemeState,
} from "./Theme";
export {
  ShellHistoryProvider,
  useShellHistory,
  useShellHistoryContext,
} from "../history/ShellHistory";
export {
  AgentSessionActions,
  AgentSessionComposer,
  AgentSessionDisclosure,
  AgentSessionDock,
  AgentSessionMessageView,
  AgentSessionPartView,
  AgentSessionSurface,
  AgentSessionThinkingRow,
  AgentSessionTimeline,
  AgentSessionTimelineRowView,
  AgentSessionToolCard,
  AgentSessionToolEntryRow,
  AgentSessionToolGroup,
  buildAgentSessionTimeline,
} from "../agent-session/AgentSessionSurface";
export type {
  AgentSessionActionEntry,
  AgentSessionComposerProps,
  AgentSessionDockAction,
  AgentSessionDockProps,
  AgentSessionMessage,
  AgentSessionMessagePart,
  AgentSessionSurfaceProps,
  AgentSessionTimelineProps,
  AgentSessionTimelineRow,
  AgentSessionToolEntry,
  AgentSessionToolStatus,
} from "../agent-session/AgentSessionSurface";
export { AgentActivity, AgentActivityList, AgentSuggestion, AgentThinking } from "../agent-activity/AgentActivity";
export type {
  AgentActivityEntry,
  AgentActivityListProps,
  AgentActivityProps,
  AgentActivityStatus,
  AgentSuggestionProps,
  AgentThinkingProps,
} from "../agent-activity/AgentActivity";
export { AgentContextAction, AgentContextSources, AgentContextSurface } from "../agent-context/AgentContextSurface";
export type {
  AgentContextActionProps,
  AgentContextAnchor,
  AgentContextMode,
  AgentContextSource,
  AgentContextStage,
  AgentContextSurfaceProps,
} from "../agent-context/AgentContextSurface";
export { AdaptiveSidecarLayout, AdaptiveSidecarSurface, getAdaptiveSidecarMode } from "../adaptive-sidecar/AdaptiveSidecar";
export type { AdaptiveSidecarLayoutProps, AdaptiveSidecarMode, AdaptiveSidecarSurfaceProps } from "../adaptive-sidecar/AdaptiveSidecar";
export { SlotPanel } from "../slot-panel/SlotPanel";
export type { SlotLauncherItem, SlotPanelHandle, SlotPanelProps, SlotTab } from "../slot-panel/SlotPanel";
export { BottomPanel, TerminalSurface, clampBottomPanelHeight } from "../bottom-panel/BottomPanel";
export type { BottomPanelHandle, BottomPanelProps, BottomPanelTab, TerminalSurfaceProps } from "../bottom-panel/BottomPanel";
export { FileTree } from "../file-tree/FileTree";
export type { FileTreeItem, FileTreeProps, TreeNode } from "../file-tree/FileTree";
export { OpalineMark } from "../icons/OpalineMark";
export {
  SettingsCard,
  SettingsChoice,
  SettingsOptionCard,
  SettingsPanel,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
  SettingsSidebar,
  SettingsToggle,
} from "../settings/Settings";
export type {
  SettingsCardProps,
  SettingsChoiceOption,
  SettingsChoiceProps,
  SettingsNavItem,
  SettingsNavSection,
  SettingsOptionCardProps,
  SettingsPanelProps,
  SettingsRowProps,
  SettingsSectionProps,
  SettingsSelectProps,
  SettingsSidebarProps,
  SettingsToggleProps,
} from "../settings/Settings";
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../components/context-menu";
export { HoverPreview } from "../primitives/HoverPreview";
export type { HoverPreviewProps } from "../primitives/HoverPreview";
export { Timeline } from "../timeline/Timeline";
export type { TimelineItem, TimelineProps, TimelineStatus } from "../timeline/Timeline";
export {
  Sidebar,
  SidebarBottomSlot,
  SidebarFooter,
  SidebarNavItemRow,
  SidebarPrimary,
  SidebarProjectRow,
  SidebarScroll,
  SidebarSection,
  SidebarThreadRow,
} from "./Sidebar";
export type { SidebarBottomSlotProps, SidebarItem, SidebarNavItem, SidebarProject, SidebarProps } from "./Sidebar";
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/card";
export {
  Dialog as ShadcnDialog,
  DialogClose as ShadcnDialogClose,
  DialogContent as ShadcnDialogContent,
  DialogDescription as ShadcnDialogDescription,
  DialogFooter as ShadcnDialogFooter,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
  DialogTrigger as ShadcnDialogTrigger,
} from "../components/dialog";
export {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuGroup as ShadcnDropdownMenuGroup,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuLabel as ShadcnDropdownMenuLabel,
  DropdownMenuSeparator as ShadcnDropdownMenuSeparator,
  DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
} from "../components/dropdown-menu";
export { ScrollArea as ShadcnScrollArea, ScrollBar as ShadcnScrollBar } from "../components/scroll-area";
export { Separator as ShadcnSeparator } from "../components/separator";
export { appActionAttributeNames, appActionAttributes } from "../sidebar/appActionAttributes";
export type {
  ShellHistoryController,
  ShellHistoryEntry,
  ShellHistoryProviderProps,
  ShellHistoryState,
  UseShellHistoryOptions,
} from "../history/ShellHistory";

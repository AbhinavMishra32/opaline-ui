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
} from "./opaline-v2/AppShell";
export { Button as LegacyButton, IconButton, Pill, StatusDot } from "./opaline-v2/Button";
export type { OpalineV2ButtonProps } from "./opaline-v2/Button";
export { Button } from "./components/button";
export {
  DesktopHeaderButton,
  DesktopHeaderIconButton,
  DESKTOP_HEADER_CONTROL_CLASS_NAME,
  DESKTOP_HEADER_ICON_CONTROL_CLASS_NAME,
  DESKTOP_HEADER_ICON_STRENGTH_CLASS_NAME,
  desktopHeaderControlVariant,
} from "./components/desktop-header-controls";
export type {
  DesktopHeaderButtonProps,
  DesktopHeaderControlTone,
  DesktopHeaderIconButtonProps,
} from "./components/desktop-header-controls";
export { DesktopWindowControls } from "./components/desktop-window-controls";
export type { DesktopWindowControlsProps } from "./components/desktop-window-controls";
export { Alert, AlertDescription, AlertTitle, Badge, Input, SearchInput, Spinner, Textarea } from "./components";
export { Switch } from "./components/switch";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs";
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/select";
export { RadioGroup, RadioGroupItem } from "./components/radio-group";
export { Label } from "./components/label";
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
} from "./opaline-v2/AppShell";
export { OpalineThemeProvider, useOpalineTheme } from "./opaline-v2/Theme";
export type {
  OpalineResolvedTheme,
  OpalineTheme,
  OpalineThemeProviderProps,
  OpalineThemeState,
} from "./opaline-v2/Theme";
export {
  ShellHistoryProvider,
  useShellHistory,
  useShellHistoryContext,
} from "./history/ShellHistory";
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
  AgentRunTrace,
  buildAgentSessionTimeline,
} from "./agent-session/AgentSessionSurface";
export { AsideThreadComposer, AsideThreadSurface } from "./agent-session/AsideThreadSurface";
export type { AsideThreadComposerProps, AsideThreadSurfaceProps } from "./agent-session/AsideThreadSurface";
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
  AgentRunTraceEntry,
} from "./agent-session/AgentSessionSurface";
export { AgentActivity, AgentActivityList, AgentSuggestion, AgentThinking } from "./agent-activity/AgentActivity";
export type {
  AgentActivityEntry,
  AgentActivityListProps,
  AgentActivityProps,
  AgentActivityStatus,
  AgentSuggestionProps,
  AgentThinkingProps,
} from "./agent-activity/AgentActivity";
export { AgentContextAction, AgentContextSources, AgentContextSurface } from "./agent-context/AgentContextSurface";
export type {
  AgentContextActionProps,
  AgentContextAnchor,
  AgentContextMode,
  AgentContextSource,
  AgentContextStage,
  AgentContextSurfaceProps,
} from "./agent-context/AgentContextSurface";
export { AdaptiveSidecarLayout, AdaptiveSidecarSurface, getAdaptiveSidecarMode } from "./adaptive-sidecar/AdaptiveSidecar";
export type { AdaptiveSidecarLayoutProps, AdaptiveSidecarMode, AdaptiveSidecarSurfaceProps } from "./adaptive-sidecar/AdaptiveSidecar";
export { SlotPanel } from "./slot-panel/SlotPanel";
export type { SlotLauncherItem, SlotPanelHandle, SlotPanelProps, SlotTab } from "./slot-panel/SlotPanel";
export { BottomPanel, TerminalSurface, clampBottomPanelHeight } from "./bottom-panel/BottomPanel";
export type { BottomPanelHandle, BottomPanelProps, BottomPanelTab, TerminalSurfaceProps } from "./bottom-panel/BottomPanel";
export { FileTree } from "./file-tree/FileTree";
export type { FileTreeItem, FileTreeProps, TreeNode } from "./file-tree/FileTree";
export { OpalineMark } from "./icons/OpalineMark";
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
} from "./settings/Settings";
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
} from "./settings/Settings";
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
} from "./components/context-menu";
export { HoverPreview } from "./primitives/HoverPreview";
export type { HoverPreviewProps } from "./primitives/HoverPreview";
export { Timeline } from "./timeline/Timeline";
export type { TimelineItem, TimelineProps, TimelineStatus } from "./timeline/Timeline";
export {
  Sidebar as LegacySidebar,
  SidebarBottomSlot,
  SidebarFooter as LegacySidebarFooter,
  SidebarNavItemRow,
  SidebarPrimary,
  SidebarProjectRow,
  SidebarScroll,
  SidebarSection,
  SidebarThreadRow,
} from "./opaline-v2/Sidebar";
export type { SidebarBottomSlotProps, SidebarItem, SidebarNavItem, SidebarProject, SidebarProps } from "./opaline-v2/Sidebar";
export {
  DesktopChromeButton,
  DesktopHeaderToolButton,
  DesktopHomeSurface,
  DesktopShell,
  DesktopSidebar,
} from "./opaline-v3/DesktopShell";
export type {
  DesktopChromeButtonProps,
  DesktopHomeSurfaceProps,
  DesktopShellState,
  DesktopShellTabItem,
  DesktopShellProps,
  DesktopSidebarItem,
  DesktopSidebarNavItem,
  DesktopSidebarProject,
  DesktopSidebarProps,
} from "./opaline-v3/DesktopShell";
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarHeaderTrigger,
  SidebarInput,
  SidebarInstanceProvider,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SIDEBAR_OFFCANVAS_MOTION_CLASS,
  SIDEBAR_OFFCANVAS_MOTION_SUPPRESSED_CLASS,
  useSidebar,
} from "./components/sidebar";
export type { SidebarResizableOptions } from "./components/sidebar";
export {
  SidebarLeadingIcon,
  SidebarPrimaryAction,
  SidebarProjectButton,
  SIDEBAR_HEADER_ROW_CLASS_NAME,
  SIDEBAR_NESTED_LIST_GAP_CLASS_NAME,
  SIDEBAR_NESTED_LIST_OFFSET_CLASS_NAME,
  SIDEBAR_ROW_ACTIVE_CLASS_NAME,
  SIDEBAR_ROW_FOCUS_CLASS_NAME,
  SIDEBAR_ROW_GAP_CLASS_NAME,
  SIDEBAR_ROW_HEIGHT_CLASS_NAME,
  SIDEBAR_ROW_HOVER_CLASS_NAME,
  SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME,
  SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME,
  SIDEBAR_ROW_MUTED_TEXT_CLASS_NAME,
  SIDEBAR_ROW_PADDING_CLASS_NAME,
  SIDEBAR_ROW_RADIUS_CLASS_NAME,
  SIDEBAR_ROW_TEXT_CLASS_NAME,
  SIDEBAR_SECTION_LABEL_CLASS_NAME,
} from "./components/sidebar-presentation";
export type {
  SidebarLeadingIconProps,
  SidebarLeadingIconSize,
  SidebarPrimaryActionProps,
  SidebarProjectButtonProps,
} from "./components/sidebar-presentation";
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card";
export {
  Dialog as ShadcnDialog,
  DialogClose as ShadcnDialogClose,
  DialogContent as ShadcnDialogContent,
  DialogDescription as ShadcnDialogDescription,
  DialogFooter as ShadcnDialogFooter,
  DialogHeader as ShadcnDialogHeader,
  DialogTitle as ShadcnDialogTitle,
  DialogTrigger as ShadcnDialogTrigger,
} from "./components/dialog";
export {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuGroup as ShadcnDropdownMenuGroup,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuLabel as ShadcnDropdownMenuLabel,
  DropdownMenuSeparator as ShadcnDropdownMenuSeparator,
  DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
  DropdownMenuSub as ShadcnDropdownMenuSub,
  DropdownMenuSubTrigger as ShadcnDropdownMenuSubTrigger,
  DropdownMenuSubContent as ShadcnDropdownMenuSubContent,
  DropdownMenuPortal as ShadcnDropdownMenuPortal,
} from "./components/dropdown-menu";
export { ScrollArea as ShadcnScrollArea, ScrollBar as ShadcnScrollBar } from "./components/scroll-area";
export { Separator as ShadcnSeparator } from "./components/separator";
export { appActionAttributeNames, appActionAttributes } from "./sidebar/appActionAttributes";
export type {
  ShellHistoryController,
  ShellHistoryEntry,
  ShellHistoryProviderProps,
  ShellHistoryState,
  UseShellHistoryOptions,
} from "./history/ShellHistory";

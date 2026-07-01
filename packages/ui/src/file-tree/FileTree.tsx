import type { CSSProperties, ReactNode } from "react";
import { ContextMenu, ContextMenuTrigger } from "../components/context-menu";
import { cn } from "../lib/utils";

export type FileTreeItem = {
  children?: FileTreeItem[];
  decoration?: ReactNode;
  gitStatus?: "added" | "modified" | "deleted" | "renamed";
  id?: string;
  hideChevron?: boolean;
  icon?: ReactNode;
  locked?: boolean;
  name: string;
  path: string;
  selected?: boolean;
  type?: "file" | "directory";
  expanded?: boolean;
  isEditing?: boolean;
  onEditSubmit?: (val: string) => void;
  onEditCancel?: () => void;
};

export type TreeNode = {
  children?: TreeNode[];
  data?: unknown;
  icon?: ReactNode;
  id: string;
  label: string;
};

export type FileTreeProps = {
  className?: string;
  coloredIcons?: boolean;
  data?: TreeNode[];
  defaultExpandedIds?: string[];
  gitLane?: boolean;
  items?: FileTreeItem[];
  onNodeClick?: (node: TreeNode) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onSelectPath?: (path: string, item: FileTreeItem) => void;
  search?: boolean;
  searchAriaLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  selectedIds?: string[];
  showActions?: boolean;
  style?: CSSProperties;
  variant?: "default" | "sidebar";
  renderRowContextMenu?: (item: FileTreeItem) => ReactNode;
};

export function FileTree({
  className,
  coloredIcons = true,
  data,
  defaultExpandedIds = [],
  gitLane = true,
  items,
  onNodeClick,
  onSelectionChange,
  onSelectPath,
  search = true,
  searchAriaLabel = "Filter files",
  searchLabel = "Filter files",
  searchPlaceholder = "Filter files...",
  showActions = true,
  style,
  variant = "default",
  renderRowContextMenu,
  selectedIds = [],
}: FileTreeProps) {
  const normalizedItems = (data ? data.map(mapTreeNodeToItem) : items ?? []).map((item) =>
    applyTreeState(item, defaultExpandedIds, selectedIds),
  );

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col text-sm", className)}
      data-file-tree-colored-icons={coloredIcons ? "true" : undefined}
      data-file-tree-variant={variant}
      style={style}
    >
      <FileTreeIconSprite />
      <div
        className="flex min-h-0 flex-1 flex-col outline-none"
        data-file-tree-has-context-menu-action-lane={showActions ? "true" : "false"}
        data-file-tree-has-git-lane={gitLane ? "true" : "false"}
        data-file-tree-virtualized-root="true"
        role="tree"
        tabIndex={-1}
      >
        {search ? (
          <div className="shrink-0 px-2 pb-2 pt-1" data-file-tree-search-container="true">
            <label className="sr-only" htmlFor="opaline-file-tree-search">
              {searchLabel}
            </label>
            <div className="flex h-7 items-center gap-2 rounded-lg border bg-background/70 px-2 text-muted-foreground focus-within:ring-2 focus-within:ring-ring/30">
              <SearchIcon />
              <input
                id="opaline-file-tree-search"
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                data-file-tree-search-input="true"
                placeholder={searchPlaceholder}
                aria-label={searchAriaLabel}
              />
            </div>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto" data-file-tree-virtualized-scroll="true">
          <div className="flex flex-col gap-0.5 px-2 pb-2 pt-1" data-file-tree-virtualized-list="true">
            {normalizedItems.map((item) => (
              <FileTreeRow
                gitLane={gitLane}
                key={item.path}
                item={item}
                level={1}
                onNodeClick={onNodeClick}
                onSelectionChange={onSelectionChange}
                onSelectPath={onSelectPath}
                showActions={showActions}
                renderRowContextMenu={renderRowContextMenu}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTreeRow({
  gitLane,
  item,
  level,
  onNodeClick,
  onSelectionChange,
  onSelectPath,
  showActions,
  renderRowContextMenu,
}: {
  gitLane: boolean;
  item: FileTreeItem;
  level: number;
  onNodeClick?: (node: TreeNode) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onSelectPath?: (path: string, item: FileTreeItem) => void;
  showActions: boolean;
  renderRowContextMenu?: (item: FileTreeItem) => ReactNode;
}) {
  const isDirectory = item.type === "directory" || item.children != null;
  const isExpanded = item.expanded !== false;
  const iconName = isDirectory ? "file-tree-icon-chevron" : item.locked === true ? "file-tree-icon-lock" : "file-tree-icon-file";
  const iconToken = getIconToken(item.name, isDirectory);

  if (item.isEditing) {
    return (
      <div
        className="relative flex h-[26px] w-full items-center gap-1.5 pr-2 text-xs"
        aria-expanded={isDirectory ? (item.expanded !== false ? "true" : "false") : undefined}
        style={
          {
            "--tree-depth": String(level - 1),
            "--tree-depth-offset": `${(level - 1) * 18}px`,
            "--tree-parent-offset": `${Math.max(0, level - 2) * 18}px`,
          } as CSSProperties
        }
      >
        {Array.from({ length: level - 1 }).map((_, index) => (
          <span
            key={index}
            className="absolute inset-y-0 w-px bg-border/50"
            style={{ left: 10 + index * 18 }}
            aria-hidden="true"
          />
        ))}
        {isDirectory && !item.hideChevron ? (
          <span className="flex size-4 shrink-0 items-center justify-center" style={{ marginLeft: 6 + (level - 1) * 18 }}>
            <svg className="size-3" data-icon-name="file-tree-icon-chevron" aria-hidden="true">
              <use href="#file-tree-icon-chevron" />
            </svg>
          </span>
        ) : (
          <span className="size-4 shrink-0" style={{ marginLeft: 6 + (level - 1) * 18 }} />
        )}
        <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4" data-item-section="icon">
          {item.icon ?? (
            <svg data-icon-name={iconName} data-icon-token={iconToken} aria-hidden="true">
              <use href={`#${iconName}`} />
            </svg>
          )}
        </span>
        <input
          className="h-6 min-w-0 flex-1 rounded-md border bg-background px-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/30"
          defaultValue={item.name}
          autoFocus
          onFocus={(e) => {
            const val = e.target.value;
            const lastDot = val.lastIndexOf(".");
            if (lastDot > 0 && item.type !== "directory") {
              e.target.setSelectionRange(0, lastDot);
            } else {
              e.target.select();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              item.onEditSubmit?.(e.currentTarget.value);
            } else if (e.key === "Escape") {
              item.onEditCancel?.();
            }
          }}
          onBlur={(e) => {
            item.onEditSubmit?.(e.currentTarget.value);
          }}
        />
      </div>
    );
  }

  const buttonElement = (
    <button
      className="group relative flex h-[26px] w-full items-center gap-1.5 rounded-[7px] pr-2 text-left text-xs text-foreground outline-none hover:bg-muted hover:text-foreground data-[item-selected=true]:bg-muted data-[item-selected=true]:font-medium data-[item-selected=true]:text-foreground"
      data-file-tree-sticky-path={level === 1 ? item.path : undefined}
      data-file-tree-sticky-row={level === 1 && isDirectory ? "true" : undefined}
      data-path={item.path}
      data-type="item"
      role="treeitem"
      aria-expanded={isDirectory ? (item.expanded !== false ? "true" : "false") : undefined}
      aria-level={level}
      data-item-selected={item.selected ? "true" : undefined}
      data-item-type={isDirectory ? "directory" : "file"}
      data-git-status={item.gitStatus}
      onClick={() => {
        onSelectPath?.(item.path, item);
        onSelectionChange?.([item.id ?? item.path]);
        onNodeClick?.(mapFileTreeItemToNode(item));
      }}
      type="button"
      style={
        {
          "--tree-depth": String(level - 1),
          "--tree-depth-offset": `${(level - 1) * 18}px`,
          "--tree-parent-offset": `${Math.max(0, level - 2) * 18}px`,
        } as CSSProperties
      }
    >
      {Array.from({ length: level - 1 }).map((_, index) => (
        <span
          key={index}
          className="absolute inset-y-0 w-px bg-border/50"
          style={{ left: 10 + index * 18 }}
          aria-hidden="true"
        />
      ))}
      {isDirectory && !item.hideChevron ? (
        <span className="flex size-4 shrink-0 items-center justify-center" style={{ marginLeft: 6 + (level - 1) * 18 }}>
          <span className={cn("block", isExpanded ? "rotate-0" : "-rotate-90")}>
            <svg className="size-3" data-icon-name="file-tree-icon-chevron" aria-hidden="true">
              <use href="#file-tree-icon-chevron" />
            </svg>
          </span>
        </span>
      ) : (
        <span className="size-4 shrink-0" style={{ marginLeft: 6 + (level - 1) * 18 }} />
      )}
      <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4" data-item-section="icon">
        {item.icon ?? (
          <svg data-icon-name={iconName} data-icon-token={iconToken} aria-hidden="true">
            <use href={`#${iconName}`} />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1 truncate" data-item-section="content">{item.name}</span>
      <span className="shrink-0" data-item-section="decoration">
        {item.decoration}
      </span>
      {gitLane ? <span className="w-4 shrink-0 text-center" data-item-section="git">{item.gitStatus != null ? <GitDot status={item.gitStatus} /> : null}</span> : null}
      {showActions ? (
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded-[4px] hover:bg-muted-foreground/20 text-muted-foreground/70 dark:text-foreground/75 hover:text-foreground dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity outline-none"
          data-item-section="action"
          onClick={(e) => {
            e.stopPropagation();
            const rowBtn = e.currentTarget.closest("button[role=treeitem]");
            if (rowBtn) {
              const rect = e.currentTarget.getBoundingClientRect();
              const ev = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
              });
              rowBtn.dispatchEvent(ev);
            }
          }}
        >
          <svg className="size-3" data-icon-name="file-tree-icon-ellipsis" aria-hidden="true">
            <use href="#file-tree-icon-ellipsis" />
          </svg>
        </button>
      ) : null}
    </button>
  );

  return (
    <>
      {renderRowContextMenu ? (
        <ContextMenu>
          <ContextMenuTrigger render={buttonElement} />
          {renderRowContextMenu(item)}
        </ContextMenu>
      ) : (
        buttonElement
      )}
      {isDirectory && item.children?.length ? (
        <div
          className="grid"
          aria-hidden={!isExpanded}
          style={{
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
            opacity: isExpanded ? 1 : 0,
            pointerEvents: isExpanded ? undefined : "none",
            transform: isExpanded ? "translateY(0)" : "translateY(-2px)",
            transition: [
              "grid-template-rows 240ms cubic-bezier(0.16, 0.84, 0.22, 1)",
              "opacity 160ms ease",
              "transform 240ms cubic-bezier(0.16, 0.84, 0.22, 1)",
            ].join(", "),
          }}
        >
          <div className="min-h-0 overflow-hidden">
            {item.children?.map((child) => (
              <FileTreeRow
                gitLane={gitLane}
                key={child.path}
                item={child}
                level={level + 1}
                onNodeClick={onNodeClick}
                onSelectionChange={onSelectionChange}
                onSelectPath={onSelectPath}
                showActions={showActions}
                renderRowContextMenu={renderRowContextMenu}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function applyTreeState(item: FileTreeItem, defaultExpandedIds: string[], selectedIds: string[]): FileTreeItem {
  const id = item.id ?? item.path;
  return {
    ...item,
    expanded: item.expanded ?? (defaultExpandedIds.includes(id) || defaultExpandedIds.includes(item.path) ? true : undefined),
    selected: item.selected ?? (selectedIds.includes(id) || selectedIds.includes(item.path)),
    children: item.children?.map((child) => applyTreeState(child, defaultExpandedIds, selectedIds)),
  };
}

function mapTreeNodeToItem(node: TreeNode): FileTreeItem {
  const data = readRecord(node.data);
  const path = typeof data.path === "string" ? data.path : node.id;
  const type = data.type === "directory" || data.type === "file" ? data.type : node.children?.length ? "directory" : "file";
  return {
    children: node.children?.map(mapTreeNodeToItem),
    decoration: data.decoration as ReactNode,
    icon: node.icon,
    id: node.id,
    locked: data.locked === true,
    name: node.label,
    path,
    type,
  };
}

function mapFileTreeItemToNode(item: FileTreeItem): TreeNode {
  return {
    children: item.children?.map(mapFileTreeItemToNode),
    data: {
      item,
      locked: item.locked,
      path: item.path,
      type: item.type ?? (item.children != null ? "directory" : "file"),
    },
    icon: item.icon,
    id: item.id ?? item.path,
    label: item.name,
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function GitDot({ status }: { status: NonNullable<FileTreeItem["gitStatus"]> }) {
  return (
    <span className="text-[10px] font-medium text-muted-foreground data-[git-status=added]:text-emerald-600 data-[git-status=deleted]:text-destructive data-[git-status=modified]:text-amber-600" data-git-status={status}>
      {status.slice(0, 1).toUpperCase()}
    </span>
  );
}

function getIconToken(name: string, isDirectory: boolean) {
  if (isDirectory) {
    return "default";
  }
  if (/\.(tsx|ts)$/.test(name)) {
    return "typescript";
  }
  if (/\.(jsx|js|mjs|cjs)$/.test(name)) {
    return "javascript";
  }
  if (/\.css$/.test(name)) {
    return "css";
  }
  if (/\.json$/.test(name)) {
    return "json";
  }
  if (/\.mdx?$/.test(name)) {
    return "markdown";
  }
  return "default";
}

function SearchIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M8.75 3.75a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm4.1 7.1 3.15 3.15"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FileTreeIconSprite() {
  return (
    <svg data-icon-sprite="" aria-hidden="true" width="0" height="0">
      <symbol id="file-tree-icon-chevron" viewBox="0 0 16 16">
        <path d="M12.4697 5.46973C12.7626 5.17684 13.2374 5.17684 13.5303 5.46973C13.8232 5.76262 13.8232 6.23738 13.5303 6.53028L8.53028 11.5303C8.23738 11.8232 7.76262 11.8232 7.46973 11.5303L2.46973 6.53028C2.17684 6.23738 2.17684 5.76262 2.46973 5.46973C2.76262 5.17684 3.23738 5.17684 3.53028 5.46973L8 9.93946L12.4697 5.46973Z" fill="currentcolor" />
      </symbol>
      <symbol id="file-tree-icon-dot" viewBox="0 0 6 6">
        <circle cx="3" cy="3" r="3" />
      </symbol>
      <symbol id="file-tree-icon-file" viewBox="0 0 16 16">
        <path fill="currentColor" d="M8 1v3a3 3 0 0 0 3 3h3v5.5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 12.5v-9A2.5 2.5 0 0 1 4.5 1z" className="bg" opacity=".5" />
        <path fill="currentColor" d="M9.5 1a.5.5 0 0 1 .354.146l4 4A.5.5 0 0 1 14 5.5V6h-3a2 2 0 0 1-2-2V1z" className="fg" />
      </symbol>
      <symbol id="file-tree-icon-lock" viewBox="0 0 16 16">
        <path fill="currentcolor" d="M4 5.336V4a4 4 0 1 1 8 0v1.336c1.586.54 2 1.843 2 4.664v1c0 4.118-.883 5-5 5H7c-4.117 0-5-.883-5-5v-1c0-2.821.414-4.124 2-4.664M5.5 4v1.054Q6.166 4.998 7 5h2q.834-.002 1.5.054V4a2.5 2.5 0 0 0-5 0m-2 6v1c0 .995.055 1.692.167 2.193.107.483.246.686.35.79s.307.243.79.35c.5.112 1.198.167 2.193.167h2c.995 0 1.692-.055 2.193-.166.483-.108.686-.247.79-.35.104-.105.243-.308.35-.791.112-.5.167-1.198.167-2.193v-1c0-.995-.055-1.692-.166-2.193-.108-.483-.247-.686-.35-.79-.105-.104-.308-.243-.791-.35C10.693 6.555 9.995 6.5 9 6.5H7c-.995 0-1.692.055-2.193.167-.483.107-.686.246-.79.35s-.243.307-.35.79C3.555 8.307 3.5 9.005 3.5 10" />
      </symbol>
      <symbol id="file-tree-icon-ellipsis" viewBox="0 0 16 16">
        <path fill="currentColor" d="M5 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M9.5 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M14 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
      </symbol>
    </svg>
  );
}

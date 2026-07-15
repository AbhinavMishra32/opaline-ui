import { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Button } from "../components/button";
import { ScrollArea } from "../components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { Switch } from "../components/switch";
import { SearchInput } from "../components/search-input";
import {
  SidebarPrimaryAction,
  SidebarProjectButton,
  SIDEBAR_NESTED_LIST_GAP_CLASS_NAME,
  SIDEBAR_SECTION_LABEL_CLASS_NAME,
} from "../components/sidebar-presentation";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
} from "../components/sidebar";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: string;
}

export interface SettingsNavSection {
  id?: string;
  label: string;
  items: SettingsNavItem[];
}

export interface SettingsSidebarProps {
  activeItemId: string;
  sections: SettingsNavSection[];
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  onItemSelect?: (item: SettingsNavItem) => void;
  onBack?: () => void;
  backLabel?: string;
  header?: ReactNode;
  footer?: ReactNode;
  query?: string;
}

export interface SettingsPanelProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export interface SettingsSectionProps {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
}

export interface SettingsCardProps {
  children: ReactNode;
  className?: string;
}

export interface SettingsRowProps {
  title?: string;
  label?: string;
  description?: ReactNode;
  action?: ReactNode;
  control?: ReactNode;
  children?: ReactNode;
}

export interface SettingsToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export interface SettingsSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export interface SettingsChoiceOption {
  label: string;
  description?: string;
  value: string;
}

export interface SettingsChoiceProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SettingsChoiceOption[];
  disabled?: boolean;
  placeholder?: string;
}

export interface SettingsOptionCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  badge?: string;
}

function SettingsSidebar({
  activeItemId,
  sections,
  searchPlaceholder = "Search settings...",
  onSearchChange,
  onItemSelect,
  onBack,
  backLabel,
  header,
  footer,
  query,
}: SettingsSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col bg-transparent font-system-ui text-sidebar-foreground">
      <SidebarContent className="gap-0 font-system-ui">
        <SidebarGroup className="p-0">
          <div className="px-1.5 py-1.5">
            {onBack ? (
              <div className="mb-3">
                <SidebarMenu>
                  <SidebarPrimaryAction
                    icon={(
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                      </svg>
                    )}
                    label={backLabel ?? "Back"}
                    onClick={onBack}
                  />
                </SidebarMenu>
              </div>
            ) : null}
            {header ?? null}
            <div className="mb-3 px-1">
              <SearchInput
                aria-label={searchPlaceholder}
                type="search"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
            <nav aria-label="Settings sections" className="flex flex-col">
              {sections.map((section) => (
                <section
                  className="flex flex-col not-first:mt-3"
                  key={section.id ?? section.label}
                >
                  <h2 className={cn("px-2 py-1", SIDEBAR_SECTION_LABEL_CLASS_NAME)}>
                    {section.label}
                  </h2>
                  <SidebarMenu className={SIDEBAR_NESTED_LIST_GAP_CLASS_NAME}>
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <SidebarProjectButton
                          active={activeItemId === item.id}
                          icon={item.icon}
                          label={item.label}
                          onClick={() => onItemSelect?.(item)}
                          trailing={item.badge ? (
                            <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">
                              {item.badge}
                            </span>
                          ) : null}
                        />
                      </li>
                    ))}
                  </SidebarMenu>
                </section>
              ))}
            </nav>
          </div>
        </SidebarGroup>
      </SidebarContent>

      {footer ? <SidebarFooter className="gap-2 p-2 font-system-ui">{footer}</SidebarFooter> : null}
    </aside>
  );
}

function SettingsPanel({ title, subtitle, children }: SettingsPanelProps) {
  return (
    <main className="app-settings-surface h-full min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-8 pb-12">
        {(title || subtitle) && (
          <div className="mb-8 min-w-0">
            {title && <h1 className="text-xl font-medium tracking-tight text-foreground">{title}</h1>}
            {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </main>
  );
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-1.5 not-first:mt-4">
      {title && (
        <div className="px-2 py-1">
          <h2 className="text-[length:var(--app-font-size-ui,12px)] font-normal text-muted-foreground/58">{title}</h2>
          {description && <p className="mt-1 text-xs leading-normal text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <div
      className={cn(
        "divide-y divide-border overflow-hidden rounded-lg border border-border bg-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SettingsRow({ title, label, description, action, control, children }: SettingsRowProps) {
  const displayLabel = title ?? label;
  const resolvedControl = control ?? action;

  return (
    <div
      className="px-3 py-[var(--app-density-settings-row-padding-y,0.625rem)]"
      data-slot="settings-row"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-0.5">
          {displayLabel ? (
            <h3 className="text-[length:var(--app-font-size-ui,12px)] font-medium text-foreground">
              {displayLabel}
            </h3>
          ) : null}
          {description ? (
            typeof description === "string" ? (
              <p className="text-[length:var(--app-font-size-ui,12px)] text-muted-foreground">
                {description}
              </p>
            ) : (
              <div className="text-[length:var(--app-font-size-ui,12px)] text-muted-foreground">
                {description}
              </div>
            )
          ) : null}
        </div>
        {resolvedControl ? (
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            {resolvedControl}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function SettingsToggle({ checked, onCheckedChange, disabled }: SettingsToggleProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  );
}

function SettingsOptionCard({ title, description, selected, onClick, icon, badge }: SettingsOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start text-left gap-3.5 rounded-lg p-4 transition-all duration-200 border cursor-pointer ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/10 text-foreground"
          : "border-border bg-background hover:bg-muted/45 text-muted-foreground"
      }`}
    >
      {icon && (
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg border transition-colors ${
          selected
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-muted text-muted-foreground border-border"
        }`}>
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-[12px] font-semibold tracking-tight ${selected ? "text-foreground" : "text-foreground/90"}`}>
            {title}
          </span>
          {selected && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Active
            </span>
          )}
          {!selected && badge && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground font-normal">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

function SettingsSelect({ value, onValueChange, options, placeholder, disabled }: SettingsSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange?.(v ?? "")} disabled={disabled}>
      <SelectTrigger className="h-8 w-44 text-xs">
        <SelectValue placeholder={placeholder ?? "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SettingsChoice({ value, onValueChange, options }: SettingsChoiceProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onValueChange?.(opt.value)}
          className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
            value === opt.value
              ? "border-primary bg-primary/5 ring-2 ring-primary/15"
              : "border-border bg-background hover:bg-muted/45"
          }`}
        >
          <div className="mt-0.5">
            {value === opt.value ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" fill="currentColor" />
              </svg>
            ) : (
              <div className="size-[18px] rounded-full border-2 border-muted-foreground/30" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium">{opt.label}</span>
            {opt.description && (
              <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

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
};

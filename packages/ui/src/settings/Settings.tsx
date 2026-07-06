import { type ReactNode } from "react";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { ScrollArea } from "../components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { Separator } from "../components/separator";
import { Switch } from "../components/switch";
import { SidebarNavItemRow } from "../opaline-v2/Sidebar";

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
    <aside className="flex h-full min-h-0 flex-col bg-transparent text-sidebar-foreground">
      <div className="flex flex-col gap-0.5 px-2.5 py-1">
        {onBack && (
          <SidebarNavItemRow
            item={{
              id: "back",
              label: backLabel ?? "Back",
              onClick: onBack,
              icon: (
                <svg className="size-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              )
            }}
          />
        )}
        {header ?? null}
      </div>

      <div className="px-2.5 pb-2">
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-7 rounded-[6px] border-transparent bg-sidebar-accent/45 px-2 text-[13px] shadow-none placeholder:text-muted-foreground/70 focus-visible:border-sidebar-border/40 focus-visible:ring-1 focus-visible:ring-ring/20"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-2.5 pt-1">
          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-0.5">
              <div className="px-2 py-1" data-sidebar="sidebar-section-heading">
                <span>
                  {section.label}
                </span>
              </div>
              {section.items.map((item) => (
                <SidebarNavItemRow
                  key={item.id}
                  item={{
                    id: item.id,
                    label: item.label,
                    active: activeItemId === item.id,
                    icon: item.icon,
                    onClick: () => onItemSelect?.(item),
                    badge: item.badge ? (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">
                        {item.badge}
                      </span>
                    ) : undefined
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {footer && (
        <>
          <Separator />
          <div className="px-2.5 py-1">{footer}</div>
        </>
      )}
    </aside>
  );
}

function SettingsPanel({ title, subtitle, children }: SettingsPanelProps) {
  return (
    <main className="h-full min-h-0 flex-1 overflow-y-auto bg-background px-6 py-8 md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-[660px] flex-col gap-8 pb-12">
        {(title || subtitle) && (
          <div className="mb-1">
            {title && <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </main>
  );
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      {title && (
        <div className="px-0.5 mb-0.5">
          <h3 className="text-[14px] font-semibold text-foreground tracking-tight">{title}</h3>
          {description && <p className="mt-1 text-xs text-muted-foreground leading-normal">{description}</p>}
        </div>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <Card className={`rounded-lg bg-card border-border/80 divide-y divide-border/40 overflow-hidden ${className || ""}`}>
      <CardContent className="flex flex-col p-0">{children}</CardContent>
    </Card>
  );
}

function SettingsRow({ title, label, description, action, control, children }: SettingsRowProps) {
  const displayLabel = title ?? label;
  const hasInlineControl = !!(control || action);

  if (hasInlineControl) {
    return (
      <div className="grid gap-3 px-5 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0 flex-1">
          {displayLabel && <Label className="text-[13px] font-semibold text-foreground tracking-tight">{displayLabel}</Label>}
          {description && (
            typeof description === "string"
              ? <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
              : <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</div>
          )}
        </div>
        <div className="flex min-w-0 justify-start md:justify-end">{control || action}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-3">
      {(displayLabel || description) && (
        <div>
          {displayLabel && <Label className="text-[13px] font-semibold text-foreground tracking-tight">{displayLabel}</Label>}
          {description && (
            typeof description === "string"
              ? <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
              : <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function SettingsToggle({ checked, onCheckedChange, disabled }: SettingsToggleProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="data-checked:bg-sky-500 dark:data-checked:bg-sky-500 border border-transparent data-checked:border-sky-500 cursor-pointer"
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

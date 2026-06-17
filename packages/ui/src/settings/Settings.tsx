import { type ReactNode } from "react";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { ScrollArea } from "../components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { Separator } from "../components/separator";
import { Switch } from "../components/switch";

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
      <div className="flex flex-col gap-1 px-3 py-2">
        {onBack && (
          <Button variant="ghost" className="h-8 w-full justify-start gap-2 px-2 text-[13px]" onClick={onBack}>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>{backLabel ?? "Back"}</span>
          </Button>
        )}
        {header ?? null}
      </div>

      <div className="px-3 pb-2">
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-8 rounded-lg bg-background/70 text-xs"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-3 pt-1">
          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-1">
              <div className="px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {section.label}
                </span>
              </div>
              {section.items.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  data-active={activeItemId === item.id ? "true" : undefined}
                  className="h-8 w-full justify-start gap-2 px-2 text-[13px] data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  onClick={() => onItemSelect?.(item)}
                >
                  <span className="grid size-[18px] shrink-0 place-items-center">{item.icon}</span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {footer && (
        <>
          <Separator />
          <div className="p-2">{footer}</div>
        </>
      )}
    </aside>
  );
}

function SettingsPanel({ title, subtitle, children }: SettingsPanelProps) {
  return (
    <main className="h-full min-h-0 flex-1 overflow-y-auto bg-background px-8 py-7">
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-7 pb-12">
        {(title || subtitle) && (
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
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
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function SettingsCard({ children, className }: SettingsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col divide-y divide-border/70 p-0">{children}</CardContent>
    </Card>
  );
}

function SettingsRow({ title, label, description, action, control, children }: SettingsRowProps) {
  const displayLabel = title ?? label;
  const hasInlineControl = !!(control || action);

  if (hasInlineControl) {
    return (
      <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0 flex-1">
          {displayLabel && <Label className="text-sm">{displayLabel}</Label>}
          {description && (
            typeof description === "string"
              ? <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              : <div className="mt-1 text-xs text-muted-foreground">{description}</div>
          )}
        </div>
        <div className="flex min-w-0 justify-start md:justify-end">{control || action}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {(displayLabel || description) && (
        <div>
          {displayLabel && <Label className="text-sm">{displayLabel}</Label>}
          {description && (
            typeof description === "string"
              ? <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              : <div className="mt-1 text-xs text-muted-foreground">{description}</div>
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
    />
  );
}

function SettingsOptionCard({ title, description, selected, onClick, icon, badge }: SettingsOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/15"
          : "border-border bg-background hover:bg-muted/45"
      }`}
    >
      {icon && (
        <div className="mt-0.5 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="mt-0.5">
        {selected ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <div className="size-[18px] rounded-full border-2 border-muted-foreground/30" />
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

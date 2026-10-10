"use client"

import type * as React from "react"
import AgentThreadDemo from "./agent-thread-demo"
import AgentThreadStatic from "./agent-thread-static"
import AgentThreadTools from "./agent-thread-tools"
import AlertDemo from "./alert-demo"
import BadgeDemo from "./badge-demo"
import ButtonSizes from "./button-sizes"
import ButtonVariants from "./button-variants"
import CardDemo from "./card-demo"
import ChoiceGroupDemo from "./choice-group-demo"
import CollapsibleDemo from "./collapsible-demo"
import CommandDemo from "./command-demo"
import ComposerAttachmentsDemo from "./composer-attachments-demo"
import ComposerDemo from "./composer-demo"
import DialogDemo from "./dialog-demo"
import DropdownMenuDemo from "./dropdown-menu-demo"
import EmptyDemo from "./empty-demo"
import FieldDemo from "./field-demo"
import HoverCardDemo from "./hover-card-demo"
import InputDemo from "./input-demo"
import InputGroupDemo from "./input-group-demo"
import KbdDemo from "./kbd-demo"
import MeterDemo from "./meter-demo"
import ModelPickerDemo from "./model-picker-demo"
import PopoverDemo from "./popover-demo"
import QuestionDemo from "./question-demo"
import SegmentedDemo from "./segmented-demo"
import SelectDemo from "./select-demo"
import SeparatorDemo from "./separator-demo"
import SkeletonDemo from "./skeleton-demo"
import SwitchDemo from "./switch-demo"
import TextareaDemo from "./textarea-demo"
import ThreadCompound from "./thread-compound"
import ThreadErrors from "./thread-errors"
import ToggleDemo from "./toggle-demo"
import TooltipDemo from "./tooltip-demo"
import ViewSwitchDemo from "./view-switch-demo"

export const examples: Record<string, React.ComponentType> = {
  "agent-thread-demo": AgentThreadDemo,
  "agent-thread-static": AgentThreadStatic,
  "agent-thread-tools": AgentThreadTools,
  "alert-demo": AlertDemo,
  "badge-demo": BadgeDemo,
  "button-sizes": ButtonSizes,
  "button-variants": ButtonVariants,
  "card-demo": CardDemo,
  "choice-group-demo": ChoiceGroupDemo,
  "collapsible-demo": CollapsibleDemo,
  "command-demo": CommandDemo,
  "composer-attachments-demo": ComposerAttachmentsDemo,
  "composer-demo": ComposerDemo,
  "dialog-demo": DialogDemo,
  "dropdown-menu-demo": DropdownMenuDemo,
  "empty-demo": EmptyDemo,
  "field-demo": FieldDemo,
  "hover-card-demo": HoverCardDemo,
  "input-demo": InputDemo,
  "input-group-demo": InputGroupDemo,
  "kbd-demo": KbdDemo,
  "meter-demo": MeterDemo,
  "model-picker-demo": ModelPickerDemo,
  "popover-demo": PopoverDemo,
  "question-demo": QuestionDemo,
  "segmented-demo": SegmentedDemo,
  "select-demo": SelectDemo,
  "separator-demo": SeparatorDemo,
  "skeleton-demo": SkeletonDemo,
  "switch-demo": SwitchDemo,
  "textarea-demo": TextareaDemo,
  "thread-compound": ThreadCompound,
  "thread-errors": ThreadErrors,
  "toggle-demo": ToggleDemo,
  "tooltip-demo": TooltipDemo,
  "view-switch-demo": ViewSwitchDemo,
}

export function Example({ name }: { name: string }) {
  const Component = examples[name]
  if (!Component) return <p className="text-ui text-destructive">Unknown example: {name}</p>
  return <Component />
}

// Modeled on the ElevenLabs language select: grouped sections ("Default",
// "Recently Used", "All Languages"), a round flag per language, a check on the
// selected row. Flags are circle-flags (MIT, https://github.com/HatScripts/circle-flags)
// copied into public/flags, one per language code.

import { Select as SelectPrimitive } from "@base-ui/react/select"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import * as React from "react"

import {
  controlItem,
  controlTrigger,
  updateFade,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

function LanguagePicker({
  value,
  onValueChange,
  trigger,
  children,
  id,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  /** What the trigger shows for the current value. */
  trigger: React.ReactNode
  children: React.ReactNode
  id?: string
  className?: string
}) {
  const listRef = React.useCallback((list: HTMLDivElement | null) => {
    if (!list) return
    updateFade(list)
    const observer = new ResizeObserver(() => updateFade(list))
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next as string)
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn("group/trigger", controlTrigger, className)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {trigger}
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-popup-open/trigger:rotate-180" />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          alignItemWithTrigger={false}
          sideOffset={4}
          className="isolate z-50"
        >
          <SelectPrimitive.Popup className="w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <SelectPrimitive.List
              ref={listRef}
              onScroll={(e) => updateFade(e.currentTarget)}
              className="max-h-[min(var(--available-height),20rem)] overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_var(--fade-top),black_calc(100%-var(--fade-bottom)),transparent)] p-1 [--fade-bottom:0px] [--fade-top:0px] data-[fade-bottom]:[--fade-bottom:2rem] data-[fade-top]:[--fade-top:2rem]"
            >
              {children}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

function LanguagePickerGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <SelectPrimitive.Group>
      <SelectPrimitive.GroupLabel className="px-2 pt-2 pb-1 text-label-sm text-muted-foreground">
        {label}
      </SelectPrimitive.GroupLabel>
      {children}
    </SelectPrimitive.Group>
  )
}

function LanguagePickerItem({
  value,
  icon,
  children,
}: {
  value: string
  /** Leading visual; defaults to the language's flag. */
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        controlItem,
        "relative flex min-h-8 cursor-default items-center gap-2 py-1.5 ps-2 pe-8 outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
      )}
    >
      {icon ?? <LanguageFlag code={value} />}
      <SelectPrimitive.ItemText className="flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute end-2 flex size-4 items-center justify-center">
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function LanguageFlag({
  code,
  className,
}: {
  code: string
  className?: string
}) {
  return (
    <img
      src={`/flags/${code}.svg`}
      alt=""
      loading="lazy"
      className={cn("size-4 shrink-0 rounded-full", className)}
    />
  )
}

export { LanguageFlag, LanguagePicker, LanguagePickerGroup, LanguagePickerItem }

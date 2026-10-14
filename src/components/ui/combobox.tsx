// A searchable select: a Popover around a cmdk Command, styled to match Select
// so the two can sit side by side. The list fades at whichever edge has more
// to scroll to.

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/** Shared by Select and Combobox triggers. */
export const controlTrigger =
  "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-hairline bg-pill px-3 text-label-sm shadow-[0_1px_1px_rgba(0,0,0,0.03)] outline-none hover:bg-pill-hover focus-visible:ring-3 focus-visible:ring-ring/30"

/** Shared by Select and Combobox popups. */
export const controlPopup = "rounded-2xl p-1"

/** Shared by Select and Combobox items. */
export const controlItem = "rounded-xl text-label-sm"

function Combobox({
  value,
  label,
  icon,
  children,
  open,
  onOpenChange,
  placeholder = "Search...",
  empty = "No results.",
  id,
  className,
}: {
  /** The selected item's value, highlighted and scrolled to on open. */
  value?: string
  /** What the trigger shows for the current value. */
  label: React.ReactNode
  /** Leading visual in the trigger. */
  icon?: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  empty?: React.ReactNode
  id?: string
  className?: string
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen

  // cmdk re-attaches the list's ref on every render, so this runs on each
  // hover too; only the first attach after opening scrolls to the selection.
  // The sizer resizes as the search filters items, which can change either edge.
  const scrolledRef = React.useRef(false)
  const listRef = React.useCallback((list: HTMLDivElement | null) => {
    const sizer = list?.firstElementChild
    if (!list || !sizer) return
    if (!scrolledRef.current) {
      scrolledRef.current = true
      list
        .querySelector("[data-checked=true]")
        ?.scrollIntoView({ block: "center" })
    }
    const observer = new ResizeObserver(() => updateFade(list))
    observer.observe(sizer)
    return () => observer.disconnect()
  }, [])

  return (
    <Popover
      open={isOpen}
      onOpenChange={(next) => {
        if (next) scrolledRef.current = false
        setInternalOpen(next)
        onOpenChange?.(next)
      }}
    >
      <PopoverTrigger
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        className={cn(controlTrigger, className)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {icon}
          <span className="flex-1 truncate text-start">{label}</span>
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-(--anchor-width) gap-0 p-0", controlPopup)}
      >
        <Command
          defaultValue={value}
          className="rounded-none bg-transparent p-0 **:data-[slot=command-group]:p-0 **:data-[slot=command-input-wrapper]:p-0"
        >
          <CommandInput placeholder={placeholder} />
          <CommandList
            ref={listRef}
            onScroll={(e) => updateFade(e.currentTarget)}
            className="mt-1 max-h-80 [mask-image:linear-gradient(to_bottom,transparent,black_var(--fade-top),black_calc(100%-var(--fade-bottom)),transparent)] [--fade-bottom:0px] [--fade-top:0px] data-[fade-bottom]:[--fade-bottom:2rem] data-[fade-top]:[--fade-top:2rem]"
          >
            <CommandEmpty className="text-label-sm text-muted-foreground">
              {empty}
            </CommandEmpty>
            {children}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ComboboxItem({
  isSelected,
  className,
  ...props
}: React.ComponentProps<typeof CommandItem> & { isSelected?: boolean }) {
  return (
    <CommandItem
      data-checked={isSelected}
      className={cn(controlItem, "data-selected:bg-accent", className)}
      {...props}
    />
  )
}

function updateFade(list: HTMLElement) {
  const { scrollTop, scrollHeight, clientHeight } = list
  list.toggleAttribute("data-fade-top", scrollTop > 0)
  list.toggleAttribute(
    "data-fade-bottom",
    scrollTop + clientHeight < scrollHeight - 1
  )
}

export { Combobox, ComboboxItem }

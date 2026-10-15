import { useHotkey } from "@tanstack/react-hotkeys"
import { LayoutGrid, Moon, Sun } from "lucide-react"
import * as React from "react"

import { GridOverlay } from "@/components/grid-overlay"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const GRID_STORAGE_KEY = "grid-overlay"

// Desktop-only shortcut hints. The hotkeys work everywhere; the toolbar just
// makes them discoverable and clickable on wide, mouse-driven screens.
export function FloatingToolbar() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const [gridVisible, setGridVisible] = React.useState(
    () => localStorage.getItem(GRID_STORAGE_KEY) === "true"
  )

  React.useEffect(() => {
    localStorage.setItem(GRID_STORAGE_KEY, String(gridVisible))
  }, [gridVisible])

  const toggleGrid = React.useCallback(() => {
    setGridVisible((visible) => !visible)
  }, [])

  useHotkey("G", toggleGrid, {
    requireReset: true,
    meta: {
      name: "Toggle grid",
      description: "Show the layout grid overlay",
    },
  })

  const isDark = resolvedTheme === "dark"

  return (
    <>
      {gridVisible && <GridOverlay />}
      <div
        role="toolbar"
        aria-label="Display shortcuts"
        className="fixed bottom-4 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-0.5 rounded-full bg-background/90 p-1 text-label-xs text-muted-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur lg:pointer-fine:flex"
      >
        <ToolbarButton
          label={isDark ? "Light mode" : "Dark mode"}
          shortcut="D"
          onClick={toggleTheme}
        >
          <span className="grid *:col-start-1 *:row-start-1">
            <Sun data-theme-transition className={iconSwap(isDark)} />
            <Moon data-theme-transition className={iconSwap(!isDark)} />
          </span>
        </ToolbarButton>
        <ToolbarButton
          label="Grid"
          shortcut="G"
          pressed={gridVisible}
          onClick={toggleGrid}
        >
          <LayoutGrid />
        </ToolbarButton>
      </div>
    </>
  )
}

// Crossfade the icons through a blur so the swap reads as one morph. Reduced
// motion keeps the fade and drops the scale and blur.
function iconSwap(visible: boolean) {
  return cn(
    "transition-[opacity,scale,filter] duration-200 ease-out-strong motion-reduce:scale-100 motion-reduce:blur-none",
    visible ? "scale-100 opacity-100 blur-none" : "scale-25 opacity-0 blur-xs"
  )
}

function ToolbarButton({
  children,
  label,
  shortcut,
  pressed,
  onClick,
}: {
  children: React.ReactNode
  label: string
  shortcut: string
  pressed?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut}
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-full ps-2.5 pe-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-3.5",
        pressed && "bg-muted text-foreground"
      )}
    >
      {children}
      {label}
      <kbd className="grid size-5 place-items-center rounded-full bg-foreground/5 font-mono text-micro">
        {shortcut}
      </kbd>
    </button>
  )
}

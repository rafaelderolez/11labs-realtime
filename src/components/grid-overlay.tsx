import { useHotkey } from "@tanstack/react-hotkeys"
import * as React from "react"

const STORAGE_KEY = "grid-overlay"
const COLUMNS = Array.from({ length: 12 }, (_, index) => index + 1)

export function GridOverlay() {
  const [visible, setVisible] = React.useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  )

  useHotkey(
    "G",
    () => {
      const next = !visible
      localStorage.setItem(STORAGE_KEY, String(next))
      setVisible(next)
    },
    {
      requireReset: true,
      meta: {
        name: "Toggle grid",
        description: "Show the layout grid overlay",
      },
    }
  )

  if (!visible) {
    return null
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <div className="page-grid lines-hidden h-full">
        <div className="col-edge row-start-1 grid grid-cols-subgrid">
          {COLUMNS.map((column) => (
            <div key={column} className="relative bg-rose-500/8">
              <span className="absolute top-2 left-1 font-mono text-micro text-rose-500/70 tabular-nums">
                {column}
              </span>
            </div>
          ))}
        </div>
        <div className="col-outer row-start-1 border-x border-rose-500" />
        <div className="col-edge row-start-1 border-x border-sky-500/70" />
        <div className="col-edge row-start-1 mx-content border-x border-dashed border-emerald-500/70" />
        <Legend />
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className="col-outer row-start-1 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 self-end justify-self-center rounded-full bg-background/90 px-4 py-2 font-mono text-micro text-muted-foreground shadow-sm ring-1 ring-black/5 backdrop-blur">
      <LegendItem className="border-rose-500" label="outer" />
      <LegendItem className="border-sky-500/70" label="edge" />
      <LegendItem
        className="border-dashed border-emerald-500/70"
        label="content"
      />
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 bg-rose-500/15" />
        12 cols
      </span>
      <span className="text-muted-foreground/60">press G to hide</span>
    </div>
  )
}

function LegendItem({
  className,
  label,
}: {
  className: string
  label: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 border-l-2 ${className}`} />
      {label}
    </span>
  )
}

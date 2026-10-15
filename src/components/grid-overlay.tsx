const COLUMNS = Array.from({ length: 12 }, (_, index) => index + 1)

export function GridOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <div className="page-grid lines-hidden h-full">
        <div className="col-edge row-start-1 grid grid-cols-subgrid">
          {COLUMNS.map((column) => (
            <div key={column} className="bg-rose-500/8" />
          ))}
        </div>
        <div className="col-outer row-start-1 border-x border-rose-500" />
        <div className="col-edge row-start-1 border-x border-sky-500/70" />
        <div className="col-edge row-start-1 mx-content border-x border-dashed border-emerald-500/70" />
      </div>
    </div>
  )
}

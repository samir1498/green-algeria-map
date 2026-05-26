import { legendItems } from './legend-items'

export function Legend() {
  return (
    <div className="bg-popover text-popover-foreground absolute right-4 bottom-20 z-[1000] space-y-1 rounded-lg border px-3 py-2 text-xs shadow-md lg:bottom-6">
      <p className="mb-1 font-semibold">Status</p>
      {legendItems.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

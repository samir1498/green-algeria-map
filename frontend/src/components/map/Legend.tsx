import { legendItems } from './helpers'

export function Legend() {
  return (
    <div className="absolute bottom-6 right-4 z-[1000] bg-popover text-popover-foreground rounded-lg shadow-md border px-3 py-2 text-xs space-y-1">
      <p className="font-semibold mb-1">Status</p>
      {legendItems.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

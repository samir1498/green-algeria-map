import { useEffect, useRef, type ReactNode } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import type { CircleMarker as LeafletCircleMarker } from 'leaflet'
import type { Zone } from '@/shared/types/zone'
import { statusColors, typeLabels, statusBadgeClasses } from '@/shared/constants/zones'
import { ZonePhotoUploader } from '@/features/zones/components/ZonePhotoUploader'
import { ZoneCtaPanel } from '@/features/zones/components/ZoneCtaPanel'

interface ZoneMarkerProps {
  zone: Zone
  onTreeInfo: (scientificName: string) => void
  onReportDamage: (zone: Zone) => void
  children?: ReactNode
}

export function ZoneMarker({ zone, onTreeInfo, onReportDamage }: ZoneMarkerProps) {
  const ref = useRef<LeafletCircleMarker>(null)

  useEffect(() => {
    const el = ref.current?.getElement()
    if (el) {
      el.setAttribute('data-testid', `zone-marker-${zone.name}`)
    } else {
      const marker = ref.current
      marker?.once('add', () => {
        marker.getElement()?.setAttribute('data-testid', `zone-marker-${zone.name}`)
      })
    }
  }, [zone.name])

  return (
    <CircleMarker
      ref={ref}
      center={[zone.lat, zone.lng]}
      radius={zone.type === 'planting' ? 14 : 10}
      pathOptions={{
        color: statusColors[zone.status],
        fillColor: statusColors[zone.status],
        fillOpacity: 0.4,
        weight: 2,
      }}
    >
      <Popup>
        <div className="max-h-[50vh] overflow-y-auto text-xs md:max-h-none md:text-sm">
          <p className="font-semibold">{zone.name}</p>
          <p className="text-muted-foreground">{typeLabels[zone.type]}</p>
          <span
            className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${statusBadgeClasses[zone.status]}`}
          >
            {zone.status}
          </span>
          {zone.targetCount != null && (
            <p className="mt-1 text-xs">
              {zone.currentCount ?? 0} / {zone.targetCount} trees
            </p>
          )}
          {zone.treeSpecies && (
            <button
              type="button"
              onClick={() => onTreeInfo(zone.treeSpecies!)}
              className="mt-1 block text-left text-xs text-green-700 underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              data-testid="tree-species-link"
            >
              {zone.treeSpecies}
            </button>
          )}
          <ZonePhotoUploader zoneId={zone.id} />
          <ZoneCtaPanel zone={zone} />
          <button
            type="button"
            onClick={() => onReportDamage(zone)}
            className="mt-2 w-full rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
            data-testid="report-damage-button"
          >
            Report Damage
          </button>
        </div>
      </Popup>
    </CircleMarker>
  )
}

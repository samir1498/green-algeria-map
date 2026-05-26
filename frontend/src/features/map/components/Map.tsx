import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from 'sonner'
import type { Zone } from '@/shared/types/zone'
import type { DamageReport } from '@/shared/types/damage-report'
import { statusColors, typeLabels, statusBadgeClasses } from '@/shared/constants/zones'
import {
  damageSeverityColors,
  damageStatusBadgeClasses,
  damageTypeLabels,
  severityLabels,
} from '@/shared/constants/damage-reports'
import { isValidCoordinate } from '@/shared/utils/coordinates'
import { formatDate } from '@/shared/utils/formatDate'
import { Legend } from './Legend'
import { DamageReportForm } from '@/features/damage-reports/components/DamageReportForm'
import { TreeInfoModal } from '@/features/tree-info/components/TreeInfoModal'
import { useTreeLookup } from '@/features/tree-info/hooks/useTreeLookup'
import { ZonePhotoUploader } from '@/features/zones/components/ZonePhotoUploader'
import { ZoneCtaPanel } from '@/features/zones/components/ZoneCtaPanel'

const ALGERIA_CENTER: [number, number] = [28.0339, 1.6596]

interface MapProps {
  zones: Zone[]
  damageReports?: DamageReport[]
  onDamageReported?: () => void
}

export function Map({ zones, damageReports = [], onDamageReported }: MapProps) {
  const [reportingZone, setReportingZone] = useState<Zone | null>(null)
  const [treeInfoModal, setTreeInfoModal] = useState<{
    taxonId: number
    scientificName: string
  } | null>(null)
  const { lookupSpecies } = useTreeLookup()

  const openReportForm = (zone: Zone) => {
    if (!isValidCoordinate(zone.lat, zone.lng)) {
      toast.error('Zone has invalid coordinates, cannot report damage')
      return
    }
    setReportingZone(zone)
  }

  const openTreeInfo = useCallback(
    async (scientificName: string) => {
      try {
        const result = await lookupSpecies(scientificName)
        if (result) {
          setTreeInfoModal(result)
        } else {
          toast.error('Species information not available')
        }
      } catch {
        toast.error('Failed to look up species information')
      }
    },
    [lookupSpecies],
  )

  return (
    <div className="relative" data-testid="map-container">
      <MapContainer
        center={ALGERIA_CENTER}
        zoom={5}
        style={{ height: '60vh', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map((zone) => (
          <CircleMarker
            key={zone.id}
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
              <div className="max-h-[50vh] overflow-y-auto text-sm md:max-h-none">
                <p className="font-semibold">{zone.name}</p>
                <p className="text-muted-foreground">{typeLabels[zone.type]}</p>
                <span
                  className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${statusBadgeClasses[zone.status]}`}
                >
                  {zone.status}
                </span>
                {zone.targetCount && (
                  <p className="mt-1 text-xs">
                    {zone.currentCount} / {zone.targetCount} trees
                  </p>
                )}
                {zone.treeSpecies && (
                  <button
                    onClick={() => openTreeInfo(zone.treeSpecies!)}
                    className="mt-1 block text-left text-xs text-green-700 underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    data-testid="tree-species-link"
                  >
                    {zone.treeSpecies}
                  </button>
                )}
                <ZonePhotoUploader zoneId={zone.id} />
                <ZoneCtaPanel zone={zone} />
                <button
                  onClick={() => openReportForm(zone)}
                  className="mt-2 w-full rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
                  data-testid="report-damage-button"
                >
                  Report Damage
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {damageReports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.lat, report.lng]}
            radius={12}
            pathOptions={{
              color: damageSeverityColors[report.severity],
              fillColor: damageSeverityColors[report.severity],
              fillOpacity: 0.6,
              weight: 3,
            }}
          >
            <Popup>
              <div className="max-h-[50vh] overflow-y-auto text-sm md:max-h-none">
                <p className="font-semibold text-red-600 dark:text-red-400">Damage Report</p>
                <p className="text-muted-foreground">{damageTypeLabels[report.type]}</p>
                <span
                  className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${damageStatusBadgeClasses[report.status]}`}
                >
                  {report.status}
                </span>
                <p className="mt-1 text-xs font-medium">
                  Severity: {severityLabels[report.severity]}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{report.description}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Reported: {formatDate(report.reportedAt)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <Legend />

      {reportingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md">
            <DamageReportForm
              zoneId={reportingZone.id}
              lat={reportingZone.lat}
              lng={reportingZone.lng}
              onSuccess={() => {
                setReportingZone(null)
                onDamageReported?.()
              }}
            />
            <button
              onClick={() => setReportingZone(null)}
              className="border-input bg-background hover:bg-muted mt-2 w-full rounded-md border px-3 py-2 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {treeInfoModal && (
        <TreeInfoModal
          taxonId={treeInfoModal.taxonId}
          scientificName={treeInfoModal.scientificName}
          onClose={() => setTreeInfoModal(null)}
        />
      )}
    </div>
  )
}

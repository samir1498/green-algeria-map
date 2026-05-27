import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from 'sonner'
import type { Zone } from '@/shared/types/zone'
import type { DamageReport } from '@/shared/types/damage-report'
import {
  damageSeverityColors,
  damageStatusBadgeClasses,
  damageTypeLabels,
  severityLabels,
} from '@/shared/constants/damage-reports'
import { isValidCoordinate } from '@/shared/utils/coordinates'
import { formatDate } from '@/shared/utils/formatDate'
import { Legend } from './Legend'
import { ZoneMarker } from './ZoneMarker'
import { DamageReportForm } from '@/features/damage-reports/components/DamageReportForm'
import { TreeInfoModal } from '@/features/tree-info/components/TreeInfoModal'
import { useTreeLookup } from '@/features/tree-info/hooks/useTreeLookup'

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
        minZoom={4}
        className="h-[50vh] w-full lg:h-[60vh]"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map((zone) => (
          <ZoneMarker
            key={zone.id}
            zone={zone}
            onTreeInfo={openTreeInfo}
            onReportDamage={openReportForm}
          />
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
              <div className="max-h-[50vh] overflow-y-auto text-xs md:max-h-none md:text-sm">
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

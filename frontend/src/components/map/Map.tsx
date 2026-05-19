import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Zone } from '@/types/zone'
import type { DamageReport } from '@/types/damage-report'
import { statusColors, typeLabels, statusBadgeClasses, damageSeverityColors, damageStatusBadgeClasses, damageTypeLabels, severityLabels } from './helpers'
import { Legend } from './Legend'
import { DamageReportForm } from '@/components/damage/DamageReportForm'

const ALGERIA_CENTER: [number, number] = [28.0339, 1.6596]

interface MapProps {
  zones: Zone[]
  damageReports: DamageReport[]
  onDamageReported?: () => void
}

export function Map({ zones, damageReports, onDamageReported }: MapProps) {
  const [reportingZone, setReportingZone] = useState<Zone | null>(null)

  return (
    <div className="relative">
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
              <div className="text-sm">
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
                <button
                  onClick={() => setReportingZone(zone)}
                  className="mt-2 w-full rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
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
              <div className="text-sm">
                <p className="font-semibold text-red-600 dark:text-red-400">Damage Report</p>
                <p className="text-muted-foreground">{damageTypeLabels[report.type]}</p>
                <span
                  className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${damageStatusBadgeClasses[report.status]}`}
                >
                  {report.status}
                </span>
                <p className="mt-1 text-xs font-medium">Severity: {severityLabels[report.severity]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reported: {new Date(report.reportedAt).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <Legend />

      {reportingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md mx-4">
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
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

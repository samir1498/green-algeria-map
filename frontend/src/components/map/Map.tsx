import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { demoZones } from './demo-data'
import { statusColors, typeLabels, statusBadgeClasses } from './helpers'
import { Legend } from './Legend'

const ALGERIA_CENTER: [number, number] = [28.0339, 1.6596]

export function Map() {
  return (
    <div className="relative">
      <MapContainer
        center={ALGERIA_CENTER}
        zoom={6}
        style={{ height: '50vh', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {demoZones.map((zone) => (
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
                <span className={`inline-block px-1.5 py-0.5 text-xs rounded mt-1 ${statusBadgeClasses[zone.status]}`}>
                  {zone.status}
                </span>
                {zone.targetCount && (
                  <p className="mt-1 text-xs">{zone.currentCount} / {zone.targetCount} trees</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <Legend />
    </div>
  )
}

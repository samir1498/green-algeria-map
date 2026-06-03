import { useMapEvents } from 'react-leaflet'

interface LocationPickerProps {
  onPick: (lat: number, lng: number) => void
}

export function LocationPicker({ onPick }: LocationPickerProps) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

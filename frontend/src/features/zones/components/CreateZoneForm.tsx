import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useCreateZone } from '@/features/zones/hooks/useCreateZone'
import { TreeSearchInput } from '@/features/tree-info/components/TreeSearchInput'
import { LocationPicker } from '@/features/zones/components/LocationPicker'
import { CreateZoneSuccess } from '@/features/zones/components/CreateZoneSuccess'

const ALGERIA_CENTER: [number, number] = [28.0339, 1.6596]

export function CreateZoneForm() {
  const navigate = useNavigate()
  const createZone = useCreateZone()

  const [name, setName] = useState('')
  const [type, setType] = useState<'planting' | 'trash' | 'cleanup'>('planting')
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [organizerContact, setOrganizerContact] = useState('')
  const [treeSpecies, setTreeSpecies] = useState('')
  const [createdZoneId, setCreatedZoneId] = useState<string | null>(null)

  const handlePick = useCallback((newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lat === null || lng === null) {
      toast.error('Click on the map to set the location')
      return
    }
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!description.trim()) {
      toast.error('Description is required')
      return
    }

    createZone.mutate(
      {
        name: name.trim(),
        type,
        lat,
        lng,
        description: description.trim(),
        organizerContact: organizerContact.trim() || undefined,
        treeSpecies: treeSpecies.trim() || undefined,
      },
      {
        onSuccess: (zone) => {
          toast.success('Zone created successfully')
          setCreatedZoneId(zone.id)
        },
        onError: () => {
          toast.error('Failed to create zone')
        },
      },
    )
  }

  const handleDone = () => {
    navigate({ to: '/' })
  }

  if (createdZoneId) {
    return <CreateZoneSuccess zoneId={createdZoneId} onDone={handleDone} />
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="create-zone-form"
      className="mx-auto max-w-2xl space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Add a New Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              data-testid="field-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chrea National Park"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              data-testid="field-type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="planting">Planting Zone</option>
              <option value="trash">Trash Location</option>
              <option value="cleanup">Cleanup Area</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <p className="text-muted-foreground text-xs">Click on the map to set the coordinates</p>
            <div
              className="h-56 overflow-hidden rounded-lg border sm:h-64"
              data-testid="map-picker"
            >
              <MapContainer
                center={ALGERIA_CENTER}
                zoom={5}
                className="h-full w-full"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker onPick={handlePick} />
                {lat !== null && lng !== null && <Marker position={[lat, lng]} />}
              </MapContainer>
            </div>
            {lat !== null && lng !== null && (
              <p className="text-xs text-gray-500">
                Selected: {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              data-testid="field-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the location and what work is needed..."
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizerContact">
              Organizer Contact <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="organizerContact"
              data-testid="field-contact"
              value={organizerContact}
              onChange={(e) => setOrganizerContact(e.target.value)}
              placeholder="Email or phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treeSpecies">
              Tree Species <span className="text-muted-foreground">(optional)</span>
            </Label>
            <TreeSearchInput
              onSelect={(scientificName) => setTreeSpecies(scientificName)}
              placeholder="Cedrus atlantica"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" data-testid="submit-zone" disabled={createZone.isPending}>
          {createZone.isPending ? 'Creating...' : 'Create Location'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: '/' })}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { ZonePhotoUploader } from '@/features/zones/components/ZonePhotoUploader'

interface CreateZoneSuccessProps {
  zoneId: string
  onDone: () => void
}

export function CreateZoneSuccess({ zoneId, onDone }: CreateZoneSuccessProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Photos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground text-sm">
          Your zone has been created. Optionally add photos to show the current state of the
          location.
        </p>
        <ZonePhotoUploader zoneId={zoneId} />
        <Button onClick={onDone} data-testid="done-photos">
          Done
        </Button>
      </CardContent>
    </Card>
  )
}

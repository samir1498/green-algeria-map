import { createFileRoute } from '@tanstack/react-router'
import { CreateZoneForm } from '@/features/zones/components/CreateZoneForm'

export const Route = createFileRoute('/zones/new')({
  component: NewZone,
})

function NewZone() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <CreateZoneForm />
    </div>
  )
}

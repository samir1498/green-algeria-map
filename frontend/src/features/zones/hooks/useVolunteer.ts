import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { registerVolunteer } from '@/features/zones/api/zones'
import type { PublicMapResponse } from '@/features/map/api/public-map'

function checkVolunteered(zoneId: string): boolean {
  try {
    const stored = sessionStorage.getItem('volunteered-zones')
    if (!stored) return false
    const set = JSON.parse(stored) as string[]
    return set.includes(zoneId)
  } catch {
    return false
  }
}

function markVolunteered(zoneId: string): void {
  try {
    const stored = sessionStorage.getItem('volunteered-zones')
    const set = stored ? (JSON.parse(stored) as string[]) : []
    set.push(zoneId)
    sessionStorage.setItem('volunteered-zones', JSON.stringify(set))
  } catch {
    /* noop */
  }
}

export function useVolunteer(zoneId: string) {
  const queryClient = useQueryClient()
  const [volunteered, setVolunteered] = useState(() => checkVolunteered(zoneId))

  const mutation = useMutation({
    mutationFn: () => registerVolunteer(zoneId),
    onSuccess: () => {
      markVolunteered(zoneId)
      setVolunteered(true)
      queryClient.setQueryData<PublicMapResponse>(['public-map'], (old) => {
        if (!old) return old
        return {
          ...old,
          zones: old.zones.map((z) =>
            z.id === zoneId ? { ...z, volunteerCount: z.volunteerCount + 1 } : z,
          ),
        }
      })
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to register volunteer')
    },
  })

  return {
    volunteer: mutation.mutate,
    hasVolunteered: volunteered,
    isPending: mutation.isPending,
  }
}

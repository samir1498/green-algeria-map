import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerVolunteer } from '@/features/zones/api/zones'

function hasVolunteered(zoneId: string): boolean {
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

  const mutation = useMutation({
    mutationFn: () => registerVolunteer(zoneId),
    onSuccess: () => {
      markVolunteered(zoneId)
      queryClient.invalidateQueries({ queryKey: ['public-map'] })
    },
  })

  return {
    volunteer: mutation.mutate,
    hasVolunteered: hasVolunteered(zoneId),
    isPending: mutation.isPending,
  }
}

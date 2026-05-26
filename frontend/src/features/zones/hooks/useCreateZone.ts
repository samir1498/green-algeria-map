import { useMutation, useQueryClient } from '@tanstack/react-query'
import { create } from '@/features/zones/api/zones'
import type { Zone } from '@/shared/types/zone'

export interface CreateZoneInput {
  name: string
  type: Zone['type']
  lat: number
  lng: number
  description: string
  organizerContact?: string
  treeSpecies?: string
}

export function useCreateZone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateZoneInput) =>
      create({
        name: input.name,
        type: input.type,
        status: 'planned',
        lat: input.lat,
        lng: input.lng,
        targetCount: null,
        currentCount: null,
        description: input.description,
        treeSpecies: input.treeSpecies ?? null,
        organizerContact: input.organizerContact ?? null,
        volunteerCount: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      queryClient.invalidateQueries({ queryKey: ['public-map'] })
    },
  })
}

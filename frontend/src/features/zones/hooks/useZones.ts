import { useQuery } from '@tanstack/react-query'
import { getAll } from '@/features/zones/api/zones'
import { demoZones } from '@/features/map/components/demo-data'
import { isValidCoordinate } from '@/features/map/components/helpers'

export function useZones() {
  const result = useQuery({
    queryKey: ['zones'],
    queryFn: getAll,
  })

  return {
    zones: result.data ?? demoZones.filter((z) => isValidCoordinate(z.lat, z.lng)),
    demoMode: result.isError && !result.isLoading,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

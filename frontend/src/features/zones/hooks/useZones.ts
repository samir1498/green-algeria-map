import { useQuery } from '@tanstack/react-query'
import { getAll } from '@/features/zones/api/zones'
import { demoZones } from '@/shared/demo/zones'
import { isValidCoordinate } from '@/shared/utils/coordinates'

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

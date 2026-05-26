import { useQuery } from '@tanstack/react-query'
import { getPublicMapData } from '@/features/map/api/public-map'

export function usePublicMapData() {
  const result = useQuery({
    queryKey: ['public-map'],
    queryFn: getPublicMapData,
  })

  return {
    zones: result.data?.zones ?? [],
    damageReports: result.data?.damageReports ?? [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

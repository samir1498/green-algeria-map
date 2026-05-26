import { useQuery } from '@tanstack/react-query'
import { getAll } from '@/features/zones/api/zones'

export function useZones() {
  const result = useQuery({
    queryKey: ['zones'],
    queryFn: getAll,
  })

  return {
    zones: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

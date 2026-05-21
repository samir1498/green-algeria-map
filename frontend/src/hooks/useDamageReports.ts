import { useQuery } from '@tanstack/react-query'
import { getAll } from '@/api/damage-reports'
import { demoDamageReports } from '@/components/map/demo-damage-data'

export function useDamageReports() {
  const result = useQuery({
    queryKey: ['damage-reports'],
    queryFn: getAll,
  })

  return {
    damageReports: result.data ?? demoDamageReports,
    demoMode: result.isError && !result.isLoading,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

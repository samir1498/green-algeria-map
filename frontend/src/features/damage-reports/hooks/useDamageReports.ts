import { useQuery } from '@tanstack/react-query'
import { getAll } from '@/features/damage-reports/api/damage-reports'
import { demoDamageReports } from '@/shared/demo/damage-reports'

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

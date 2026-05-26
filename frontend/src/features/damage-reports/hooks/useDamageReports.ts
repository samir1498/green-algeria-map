import { useQuery } from '@tanstack/react-query'
import { getAll } from '@/features/damage-reports/api/damage-reports'

export function useDamageReports() {
  const result = useQuery({
    queryKey: ['damage-reports'],
    queryFn: getAll,
  })

  return {
    damageReports: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

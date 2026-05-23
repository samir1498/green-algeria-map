import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { create } from '@/features/damage-reports/api/damage-reports'
import type { DamageReport } from '@/shared/types/damage-report'

interface CreateDamageReportInput {
  zoneId: string
  type: DamageReport['type']
  severity: DamageReport['severity']
  status: DamageReport['status']
  lat: number
  lng: number
  description: string
  reportedBy: string
}

export function useCreateDamageReport(onSuccess?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDamageReportInput) => create(input),
    onSuccess: () => {
      toast.success('Damage report submitted')
      queryClient.invalidateQueries({ queryKey: ['damage-reports'] })
      onSuccess?.()
    },
    onError: () => {
      toast.error('Failed to submit damage report')
    },
  })
}

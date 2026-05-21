import { getAll, getById, getByZoneId, create, updateStatus, remove } from '@/api/damage-reports'
import type { DamageReportService } from './damage-report-service.interface'

export const damageReportService: DamageReportService = {
  getAll,
  getById,
  getByZoneId,
  create,
  updateStatus,
  remove,
}

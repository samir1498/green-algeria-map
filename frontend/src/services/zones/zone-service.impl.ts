import { getAll, getById, create, update, remove } from '@/api/zones'
import type { ZoneService } from './zone-service.interface'

export const zoneService: ZoneService = {
  getAll,
  getById,
  create,
  update,
  remove,
}

import type { Zone } from '@/types/zone'

export interface ZoneService {
  getAll(): Promise<Zone[]>
  getById(id: string): Promise<Zone>
  create(input: Omit<Zone, 'id'>): Promise<Zone>
  update(id: string, input: Partial<Zone>): Promise<Zone>
  remove(id: string): Promise<void>
}

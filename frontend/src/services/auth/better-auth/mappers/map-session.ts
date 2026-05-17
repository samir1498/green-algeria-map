import type { AuthSession } from '../../types'
import { mapUser } from './map-user'

export function mapSession(raw: Record<string, unknown>): AuthSession {
  return {
    user: mapUser(raw.user as Record<string, unknown>),
  }
}

import type { AppError } from '@/services/error/types'
import type { AuthSession } from './types'

export interface SessionService {
  getSession(): Promise<AuthSession | null>
  useSession(): { data: AuthSession | null; isPending: boolean; error: AppError | null; refetch: () => void }
}

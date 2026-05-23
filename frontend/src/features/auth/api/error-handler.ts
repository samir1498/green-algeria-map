import type { AppError } from '@/shared/types/error'

export function normalizeAuthError(error: { message?: string; code?: string }): AppError {
  return {
    message: error.message ?? 'Authentication error',
    code: error.code ?? 'UNKNOWN',
    category: 'auth',
  }
}

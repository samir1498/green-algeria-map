import type { AppError } from './types'
import { ERROR_MESSAGES } from './error-codes'

export function normalizeAuthError(raw: { message?: string; code?: string; status?: number }): AppError {
  const code = raw.code ?? ''
  const knownMessage = code in ERROR_MESSAGES ? ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] : undefined
  const message = knownMessage ?? raw.message ?? 'Authentication failed'

  return {
    message,
    code,
    category: 'auth',
    status: raw.status,
  }
}

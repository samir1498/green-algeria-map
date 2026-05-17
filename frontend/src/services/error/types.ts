export type ErrorCategory = 'auth' | 'network' | 'validation' | 'server' | 'unknown'

export interface AppError {
  message: string
  code: string
  category: ErrorCategory
  status?: number
}

import type { AppError } from '@/services/error/types'
import type { AuthCredentials, AuthUser, SignUpData } from './types'

export interface AuthService {
  signIn(credentials: AuthCredentials): Promise<{ data: { user: AuthUser } | null; error: AppError | null }>
  signUp(data: SignUpData): Promise<{ data: { user: AuthUser } | null; error: AppError | null }>
  signOut(): Promise<{ error: AppError | null }>
}

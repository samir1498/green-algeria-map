import type { AppError } from '@/shared/types/error'
import type { AuthCredentials, AuthUser, SignUpData } from './types'

export interface AuthService {
  signIn(
    credentials: AuthCredentials,
  ): Promise<{ data: { user: AuthUser } | null; error: AppError | null }>
  signUp(data: SignUpData): Promise<{ data: { user: AuthUser } | null; error: AppError | null }>
  signOut(): Promise<{ error: AppError | null }>
}

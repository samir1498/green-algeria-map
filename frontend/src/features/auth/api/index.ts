import { betterAuthService } from './auth-service.impl'
import { betterAuthSessionService } from './session-service.impl'
import type { UserRole } from './types'

export { betterAuthService as authService }
export { betterAuthSessionService as sessionService }
export type { AuthUser, AuthSession, AuthCredentials, SignUpData, UserRole } from './types'
export type { AuthService } from './auth-service.interface'
export type { SessionService } from './session-service.interface'

export function useAuth() {
  const { data, isPending, error, refetch } = betterAuthSessionService.useSession()

  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isPending,
    error,
    signIn: betterAuthService.signIn,
    signUp: betterAuthService.signUp,
    signOut: betterAuthService.signOut,
    refetchSession: refetch,
    hasRole: (role: UserRole) => data?.user.role === role,
  }
}

import { betterAuthService } from '@/features/auth/api/auth-service.impl'
import { betterAuthSessionService } from '@/features/auth/api/session-service.impl'
import type { UserRole } from '@/features/auth/api/types'

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

import { authService, sessionService } from '@/features/auth/api'
import type { UserRole } from '@/features/auth/api/types'

export function useAuth() {
  const { data, isPending, error, refetch } = sessionService.useSession()

  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isPending,
    error,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
    refetchSession: refetch,
    hasRole: (role: UserRole) => data?.user.role === role,
  }
}

import type { AuthService } from './auth-service.interface'
import { api } from '@/shared/lib/axios'
import { mapUser } from './mappers/map-user'
import type { AuthCredentials, SignUpData } from './types'

export const springAuthService: AuthService = {
  async signIn(credentials: AuthCredentials) {
    try {
      const { data } = await api.post('/api/auth/sign-in/email', credentials)
      if (!data?.user) {
        return { data: null, error: { message: 'Sign in failed', code: 'UNKNOWN', category: 'auth' } }
      }
      return { data: { user: mapUser(data.user as Record<string, unknown>) }, error: null }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Sign in failed'
      return { data: null, error: { message, code: 'AUTH_ERROR', category: 'auth' } }
    }
  },

  async signUp(data: SignUpData) {
    try {
      const { data: result } = await api.post('/api/auth/sign-up/email', data)
      if (!result?.user) {
        return { data: null, error: { message: 'Sign up failed', code: 'UNKNOWN', category: 'auth' } }
      }
      return { data: { user: mapUser(result.user as Record<string, unknown>) }, error: null }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Sign up failed'
      return { data: null, error: { message, code: 'AUTH_ERROR', category: 'auth' } }
    }
  },

  async signOut() {
    try {
      await api.post('/api/auth/sign-out')
      return { error: null }
    } catch {
      return { error: { message: 'Sign out failed', code: 'AUTH_ERROR', category: 'auth' } }
    }
  },
}

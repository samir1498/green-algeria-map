import type { AuthService } from '../auth-service.interface'
import { authClient } from './auth-client'
import { normalizeAuthError } from '@/services/error/error-handler'
import { mapUser } from './mappers/map-user'

export const betterAuthService: AuthService = {
  async signIn(credentials) {
    const { data, error } = await authClient.signIn.email(credentials)
    if (error) {
      return { data: null, error: normalizeAuthError(error) }
    }
    if (!data?.user) {
      return { data: null, error: { message: 'Sign in failed', code: 'UNKNOWN', category: 'unknown' } }
    }
    return { data: { user: mapUser(data.user) }, error: null }
  },

  async signUp(data) {
    const { data: result, error } = await authClient.signUp.email(data)
    if (error) {
      return { data: null, error: normalizeAuthError(error) }
    }
    if (!result?.user) {
      return { data: null, error: { message: 'Sign up failed', code: 'UNKNOWN', category: 'unknown' } }
    }
    return { data: { user: mapUser(result.user) }, error: null }
  },

  async signOut() {
    const { error } = await authClient.signOut()
    if (error) {
      return { error: normalizeAuthError(error) }
    }
    return { error: null }
  },
}

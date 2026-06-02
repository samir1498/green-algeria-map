import type { SessionService } from './session-service.interface'
import { authClient } from './auth-client'
import { normalizeAuthError } from './error-handler'
import { mapSession } from './map-session'

export const betterAuthSessionService: SessionService = {
  async getSession() {
    const { data, error } = await authClient.getSession()
    if (error || !data?.user) {
      return null
    }
    return mapSession(data)
  },

  useSession() {
    const { data, isPending, error, refetch } = authClient.useSession()

    const mappedData = data?.user ? mapSession(data) : null
    const mappedError = error ? normalizeAuthError(error) : null

    return {
      data: mappedData,
      isPending,
      error: mappedError,
      refetch,
    }
  },
}

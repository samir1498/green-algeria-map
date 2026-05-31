import { useState, useEffect, useCallback } from 'react'
import type { SessionService } from './session-service.interface'
import { api } from '@/shared/lib/axios'
import { mapSession } from './mappers/map-session'
import type { AuthSession } from './types'

export const springSessionService: SessionService = {
  async getSession() {
    try {
      const { data } = await api.get('/api/auth/get-session')
      if (!data?.user) return null
      return mapSession(data as Record<string, unknown>)
    } catch {
      return null
    }
  },

  useSession() {
    const [data, setData] = useState<AuthSession | null>(null)
    const [isPending, setIsPending] = useState(true)
    const [error, setError] = useState<{ message: string; code: string; category: string } | null>(null)

    const fetch = useCallback(async () => {
      setIsPending(true)
      try {
        const session = await springSessionService.getSession()
        setData(session)
        setError(null)
      } catch (err: unknown) {
        setData(null)
        setError({
          message: (err as Error)?.message ?? 'Session fetch failed',
          code: 'SESSION_ERROR',
          category: 'auth',
        })
      } finally {
        setIsPending(false)
      }
    }, [])

    useEffect(() => { fetch() }, [fetch])

    return { data, isPending, error: error, refetch: fetch }
  },
}

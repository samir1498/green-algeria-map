import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionService } from '@/features/auth/api'
import { sanitizeRedirect } from '@/shared/utils/sanitize-redirect'
import { LoginPage } from './LoginPage'

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; oauth?: string } => {
    return {
      ...(typeof search.redirect === 'string'
        ? { redirect: sanitizeRedirect(search.redirect) }
        : {}),
      ...(typeof search.oauth === 'string' && ['success', 'error'].includes(search.oauth)
        ? { oauth: search.oauth }
        : {}),
    }
  },
  beforeLoad: async () => {
    const session = await sessionService.getSession()
    if (session?.user) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

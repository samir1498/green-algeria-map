import { createFileRoute } from '@tanstack/react-router'
import { VerifyEmailPage } from './VerifyEmailPage'

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { email?: string; verified?: boolean } => {
    return {
      email: typeof search.email === 'string' ? search.email : undefined,
      verified: search.verified === 'true',
    }
  },
  component: VerifyEmailPage,
})

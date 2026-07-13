import { createFileRoute } from '@tanstack/react-router'
import { ResetPasswordPage } from './ResetPasswordPage'

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: (search: Record<string, unknown>): { token: string } => {
    if (typeof search.token !== 'string' || !search.token) {
      throw new Error('Missing reset token')
    }
    return { token: search.token }
  },
  component: ResetPasswordPage,
})

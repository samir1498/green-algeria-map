import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionService } from '@/features/auth/api'
import { SettingsPage } from './SettingsPage'

export const Route = createFileRoute('/auth/settings')({
  beforeLoad: async () => {
    const session = await sessionService.getSession()
    if (!session?.user) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: SettingsPage,
})

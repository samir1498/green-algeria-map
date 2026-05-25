import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { sessionService } from '@/features/auth/api'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const session = await sessionService.getSession()
    if (!session?.user) {
      throw redirect({
        to: '/auth/login',
        search: { redirect: location.href },
      })
    }
    return { user: session.user }
  },
  component: Outlet,
})

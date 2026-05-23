import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { sessionService } from '@/features/auth/api'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await sessionService.getSession()
    if (!session?.user) {
      throw redirect({
        to: '/auth/login',
      })
    }
    return { user: session.user }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Outlet />
    </div>
  )
}

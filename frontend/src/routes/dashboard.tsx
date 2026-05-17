import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { sessionService } from '@/services/auth'

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Outlet />
    </div>
  )
}

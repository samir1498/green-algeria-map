import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Outlet />
    </div>
  )
}

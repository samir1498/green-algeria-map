import { createFileRoute } from '@tanstack/react-router'
import { Route as AuthenticatedRoute } from '../../_authenticated'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = AuthenticatedRoute.useRouteContext()

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold" data-testid="dashboard-welcome">
          Welcome, {user.name}
        </h1>
        <p className="text-muted-foreground">Manage your contributions and track progress</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize" data-testid="dashboard-role">
              {user.role}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm" data-testid="dashboard-email">
              {user.email}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm" data-testid="dashboard-status">
              {user.emailVerified ? 'Verified' : 'Pending verification'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

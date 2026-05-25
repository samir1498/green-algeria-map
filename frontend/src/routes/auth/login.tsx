import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'
import { sessionService } from '@/features/auth/api'
import { sanitizeRedirect } from '@/shared/utils/sanitize-redirect'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    return typeof search.redirect === 'string'
      ? { redirect: sanitizeRedirect(search.redirect) }
      : {}
  },
  beforeLoad: async () => {
    const session = await sessionService.getSession()
    if (session?.user) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

export function LoginPage() {
  const { signIn } = useAuth()
  const search = Route.useSearch()
  const { email, password, loading, handleSubmit, setEmail, setPassword } = useLoginForm({
    signIn,
    redirectTo: search.redirect,
  })

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="submit-button">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link
                to="/auth/register"
                className="text-primary hover:underline"
                data-testid="sign-up-link"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

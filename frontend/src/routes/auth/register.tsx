import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useRegisterForm } from '@/features/auth/hooks/useRegisterForm'
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

export const Route = createFileRoute('/auth/register')({
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
  component: RegisterPage,
})

export function RegisterPage() {
  const { signUp } = useAuth()
  const search = Route.useSearch()
  const { name, email, password, loading, handleSubmit, setName, setEmail, setPassword } =
    useRegisterForm({ signUp, redirectTo: search.redirect })

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up to start contributing to Green Algeria</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                data-testid="name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                data-testid="email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
                data-testid="password-input"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="submit-button">
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="text-primary hover:underline"
                data-testid="sign-in-link"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

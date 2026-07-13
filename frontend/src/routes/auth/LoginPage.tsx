import { getRouteApi, Link } from '@tanstack/react-router'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authClient } from '@/features/auth/api/auth-client'
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

const routeApi = getRouteApi('/auth/login')

export function LoginPage() {
  const { signIn, refetchSession } = useAuth()
  const search = routeApi.useSearch()
  const { email, password, loading, handleSubmit, setEmail, setPassword } = useLoginForm({
    signIn,
    redirectTo: search.redirect,
    onSuccess: refetchSession,
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
              <div className="flex justify-end">
                <Link
                  to="/auth/forgot-password"
                  className="text-muted-foreground text-sm hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="submit-button">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => authClient.signIn.social({ provider: 'google' })}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => authClient.signIn.social({ provider: 'github' })}
              >
                GitHub
              </Button>
            </div>
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

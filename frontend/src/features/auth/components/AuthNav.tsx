import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogOut, User } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function AuthNav() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isPending, signOut } = useAuth()

  if (isPending) {
    return <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth/login">
          <Button variant="ghost" size="sm" data-testid="nav-sign-in">
            Sign In
          </Button>
        </Link>
        <Link to="/auth/register">
          <Button size="sm">Sign Up</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link to="/dashboard">
        <Button variant="ghost" size="sm" className="gap-1">
          <User className="h-4 w-4" />
          {user?.name}
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          const result = await signOut()
          if (!result.error) {
            navigate({ to: '/' })
          }
        }}
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}

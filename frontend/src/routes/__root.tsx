import { Outlet, createRootRoute, Link, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Moon, Sun, LogOut, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/services/auth'
import { useTheme } from '@/hooks/useTheme'
import { DefaultErrorBoundary } from '@/components/DefaultErrorBoundary'
import { NotFound } from '@/components/NotFound'
import '@/styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'Map-based platform for tracking reforestation efforts across Algeria' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  component: RootComponent,
  errorComponent: DefaultErrorBoundary,
  notFoundComponent: NotFound,
})

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

function AuthNav() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isPending, signOut } = useAuth()

  if (isPending) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth/login">
          <Button variant="ghost" size="sm">Sign In</Button>
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

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-semibold text-lg">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 32 32" fill="currentColor">
                <circle cx="16" cy="16" r="14" />
                <path d="M16 8c-2 4-6 8-6 12a6 6 0 0012 0c0-4-4-8-6-12z" />
              </svg>
            Green Algeria Map
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium hover:text-foreground/80">Map</a>
            <a href="/about" className="text-sm font-medium hover:text-foreground/80">About</a>
            <AuthNav />
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Green Algeria Map — Tracking reforestation efforts</p>
      </footer>
      <div id="portal-root" />
      <Toaster />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  )
}

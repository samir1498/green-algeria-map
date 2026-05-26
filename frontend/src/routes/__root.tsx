import { useState } from 'react'
import { Outlet, createRootRouteWithContext, Link, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Moon, Sun, LogOut, User, Loader2, Menu, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Toaster } from '@/shared/components/ui/sonner'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { AuthUser } from '@/features/auth/api/types'
import { useTheme } from '@/shared/hooks/useTheme'
import { DefaultErrorBoundary } from '@/shared/components/DefaultErrorBoundary'
import { NotFound } from '@/shared/components/NotFound'
import '@/styles.css'

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isPending: boolean
}

export const Route = createRootRouteWithContext<{ auth: AuthState }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content: 'Map-based platform for tracking reforestation efforts across Algeria',
      },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
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

function RootComponent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-b">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-2 text-lg font-semibold">
            <svg className="h-6 w-6 text-green-600" viewBox="0 0 32 32" fill="currentColor">
              <circle cx="16" cy="16" r="14" />
              <path d="M16 8c-2 4-6 8-6 12a6 6 0 0012 0c0-4-4-8-6-12z" />
            </svg>
            <span className="hidden sm:inline">Green Algeria Map</span>
            <span className="sm:hidden">GAM</span>
          </a>
          <div className="hidden items-center gap-4 md:flex">
            <a
              href="/"
              className="hover:text-foreground/80 text-sm font-medium"
              data-testid="nav-map"
            >
              Map
            </a>
            <a
              href="/about"
              className="hover:text-foreground/80 text-sm font-medium"
              data-testid="nav-about"
            >
              About
            </a>
            <AuthNav />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              data-testid={mobileMenuOpen ? 'close-menu-button' : 'open-menu-button'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
        {mobileMenuOpen && (
          <div className="border-t px-4 pt-2 pb-4 md:hidden">
            <div className="flex flex-col gap-2">
              <a
                href="/"
                className="hover:text-foreground/80 rounded px-2 py-1.5 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-map"
              >
                Map
              </a>
              <a
                href="/about"
                className="hover:text-foreground/80 rounded px-2 py-1.5 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-about"
              >
                About
              </a>
              <div className="border-t pt-2">
                <AuthNav />
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="text-muted-foreground border-t py-6 text-center text-sm">
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

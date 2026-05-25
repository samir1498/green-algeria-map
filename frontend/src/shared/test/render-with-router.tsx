import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { AuthState } from '@/routes/__root'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

interface RenderAuthRouteOptions {
  initialEntries?: string[]
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>
}

export async function renderAuthRoute(
  path: string,
  component: ReactElement,
  options?: RenderAuthRouteOptions,
) {
  const auth: AuthState = { user: null, isAuthenticated: false, isPending: false }
  const rootRoute = createRootRouteWithContext<{ auth: AuthState }>()({
    component: () => <Outlet />,
  })

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <div>Home</div>,
  })

  const route = createRoute({
    getParentRoute: () => rootRoute,
    path,
    component: () => component,
    validateSearch: options?.validateSearch,
  })

  const routeTree = rootRoute.addChildren([indexRoute, route])
  const history = createMemoryHistory({ initialEntries: options?.initialEntries ?? [path] })
  const router = createRouter({ routeTree, history, context: { auth }, defaultPendingMs: 0 })

  await router.load()

  const queryClient = createTestQueryClient()
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { user: userEvent.setup(), router, container }
}

export { screen, waitFor, act } from '@testing-library/react'

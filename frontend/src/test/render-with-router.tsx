import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { QueryClient } from '@tanstack/react-query'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { Router, AnyRoute } from '@tanstack/react-router'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

interface RenderWithRouterResult {
  user: ReturnType<typeof userEvent.setup>
  rerender: (ui: ReactElement) => void
  unmount: () => void
  container: HTMLElement
  router: Router<AnyRoute>
}

export async function renderWithRouter(
  component: ReactElement,
): Promise<RenderWithRouterResult> {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => component,
  })

  const routeTree = rootRoute.addChildren([testRoute])
  const history = createMemoryHistory({ initialEntries: ['/'] })
  const router = createRouter({
    routeTree,
    history,
    defaultPendingMs: 0,
  })

  await router.load()

  const queryClient = createTestQueryClient()

  const { rerender, unmount, container } = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return {
    user: userEvent.setup(),
    rerender,
    unmount,
    container,
    router,
  }
}

export { screen, waitFor, act } from '@testing-library/react'

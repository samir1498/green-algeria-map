import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { RouteComponent } from '@tanstack/react-router'

interface RenderWithRouterOptions {
  initialEntry?: string
}

interface RenderWithRouterResult {
  user: ReturnType<typeof userEvent.setup>
  router: ReturnType<typeof createRouter>
  rerender: (ui: React.ReactElement) => void
  unmount: () => void
  container: HTMLElement
}

export async function renderWithRouter(
  Component: RouteComponent,
  { initialEntry = '/' }: RenderWithRouterOptions = {},
): Promise<RenderWithRouterResult> {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Component,
  })

  const routeTree = rootRoute.addChildren([testRoute])
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = createRouter({
    routeTree,
    history,
    defaultPendingMinMs: 0,
  }) as ReturnType<typeof createRouter>

  await router.load()

  const { rerender, unmount, container } = render(
    <RouterProvider router={router} />,
  )

  return {
    user: userEvent.setup(),
    router,
    rerender,
    unmount,
    container,
  }
}

export { screen, waitFor, act } from '@testing-library/react'

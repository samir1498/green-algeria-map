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
import type { ReactElement } from 'react'

interface RenderWithRouterResult {
  user: ReturnType<typeof userEvent.setup>
  rerender: (ui: ReactElement) => void
  unmount: () => void
  container: HTMLElement
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

  const { rerender, unmount, container } = render(
    <RouterProvider router={router} />,
  )

  return {
    user: userEvent.setup(),
    rerender,
    unmount,
    container,
  }
}

export { screen, waitFor, act } from '@testing-library/react'
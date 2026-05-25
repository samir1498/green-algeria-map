import { createRouter } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { DefaultErrorBoundary } from '@/shared/components/DefaultErrorBoundary'
import type { AuthState } from '@/routes/__root'

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultErrorBoundary,
  context: {
    auth: undefined! as AuthState,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

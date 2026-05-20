import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { DefaultErrorBoundary } from '@/components/DefaultErrorBoundary'

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultErrorBoundary,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

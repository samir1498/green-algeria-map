import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/devtools'
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
})

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-semibold text-lg">
            <svg className="w-6 h-6 text-green-600" viewBox="0 0 32 32" fill="currentColor">
              <circle cx="16" cy="16" r="14" />
              <path d="M16 8c-2 4-6 8-6 12a6 6 0 0012 0c0-4-4-8-6-12z" fill="#15803d" />
            </svg>
            Green Algeria Map
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm font-medium hover:text-green-600">Map</a>
            <a href="/about" className="text-sm font-medium hover:text-green-600">About</a>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-gray-500">
        <p>Green Algeria Map — Tracking reforestation efforts</p>
      </footer>
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
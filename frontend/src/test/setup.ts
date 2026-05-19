import * as matchers from '@testing-library/jest-dom/matchers'
import { expect, beforeAll, vi } from 'vitest'

expect.extend(matchers)

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMediaMock,
  })
})

vi.mock('@tanstack/devtools', async (actual) => {
  const mod = await actual() as any
  return {
    ...mod,
    TanStackDevtools: () => null,
    TanStackRouterDevtoolsPanel: () => null,
  }
})
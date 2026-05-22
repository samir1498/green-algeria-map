import * as matchers from '@testing-library/jest-dom/matchers'
import { expect, beforeAll, beforeEach, vi } from 'vitest'

expect.extend(matchers)

const store: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k] }),
  get length() { return Object.keys(store).length },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
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

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
})

vi.mock('@tanstack/devtools', async (actual) => {
  const mod = await actual() as any
  return {
    ...mod,
    TanStackDevtools: () => null,
    TanStackRouterDevtoolsPanel: () => null,
  }
})
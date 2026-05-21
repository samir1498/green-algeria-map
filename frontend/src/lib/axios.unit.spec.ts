import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from './axios'
import type { AxiosError } from 'axios'

const mockInterceptors = vi.hoisted(() => ({
  use: vi.fn(),
}))

vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      response: { use: vi.fn() },
    },
    defaults: {
      baseURL: '',
      headers: { common: {} },
    },
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
    AxiosError: class MockAxiosError extends Error {
      response?: { status: number; data?: unknown }
      constructor(message: string, status?: number, data?: unknown) {
        super(message)
        this.response = status ? { status, data } : undefined
      }
    },
  }
})

describe('normalizeApiError', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { pathname: '/some-page' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('classifies network errors', async () => {
    const mockAxiosError = new Error('Network Error') as AxiosError
    mockAxiosError.response = undefined

    try {
      const interceptor = (vi.mocked(api.interceptors.response.use).mock.calls[0]?.[1]) as (err: AxiosError) => Promise<unknown>
      await interceptor(mockAxiosError)
    } catch (appError: unknown) {
      const err = appError as { message: string; code: string; category: string }
      expect(err.message).toBe('Unable to connect to the server. Please check your connection.')
      expect(err.code).toBe('NETWORK_ERROR')
      expect(err.category).toBe('network')
    }
  })

  it('classifies 401 errors and redirects to login', async () => {
    const mockAxiosError = new Error('Unauthorized') as AxiosError
    mockAxiosError.response = { status: 401, data: {} } as any

    try {
      const interceptor = (vi.mocked(api.interceptors.response.use).mock.calls[0]?.[1]) as (err: AxiosError) => Promise<unknown>
      await interceptor(mockAxiosError)
    } catch (appError: unknown) {
      const err = appError as { message: string; code: string; category: string; status: number }
      expect(err.message).toBe('Unauthorized')
      expect(err.code).toBe('UNAUTHORIZED')
      expect(err.category).toBe('auth')
      expect(err.status).toBe(401)
    }
  })

  it('classifies 500 errors', async () => {
    const mockAxiosError = new Error('Server Error') as AxiosError
    mockAxiosError.response = { status: 500, data: {} } as any

    try {
      const interceptor = (vi.mocked(api.interceptors.response.use).mock.calls[0]?.[1]) as (err: AxiosError) => Promise<unknown>
      await interceptor(mockAxiosError)
    } catch (appError: unknown) {
      const err = appError as { message: string; code: string; category: string }
      expect(err.message).toBe('Server error. Please try again later.')
      expect(err.code).toBe('SERVER_ERROR')
      expect(err.category).toBe('server')
    }
  })

  it('classifies 422 errors', async () => {
    const mockAxiosError = new Error('Validation Error') as AxiosError
    mockAxiosError.response = { status: 422, data: { message: 'Invalid input' } } as any

    try {
      const interceptor = (vi.mocked(api.interceptors.response.use).mock.calls[0]?.[1]) as (err: AxiosError) => Promise<unknown>
      await interceptor(mockAxiosError)
    } catch (appError: unknown) {
      const err = appError as { message: string; code: string; category: string }
      expect(err.message).toBe('Invalid input')
      expect(err.code).toBe('VALIDATION_ERROR')
      expect(err.category).toBe('validation')
    }
  })

  it('does not redirect when already on login page', async () => {
    vi.stubGlobal('window', { location: { pathname: '/auth/login' } })

    const mockAxiosError = new Error('Unauthorized') as AxiosError
    mockAxiosError.response = { status: 401, data: {} } as any

    try {
      const interceptor = (vi.mocked(api.interceptors.response.use).mock.calls[0]?.[1]) as (err: AxiosError) => Promise<unknown>
      await interceptor(mockAxiosError)
    } catch {
      // Expected
    }
  })
})

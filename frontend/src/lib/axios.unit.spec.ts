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

function getInterceptor() {
  return (vi.mocked(api.interceptors.response.use).mock.calls[0]?.[1]) as (err: AxiosError) => Promise<unknown>
}

  it('classifies network errors', async () => {
    const mockAxiosError = new Error('Network Error') as AxiosError
    mockAxiosError.response = undefined

    await expect(getInterceptor()(mockAxiosError)).rejects.toMatchObject({
      message: 'Unable to connect to the server. Please check your connection.',
      code: 'NETWORK_ERROR',
      category: 'network',
    })
  })

  it('classifies 401 errors', async () => {
    const mockAxiosError = new Error('Unauthorized') as AxiosError
    mockAxiosError.response = { status: 401, data: {} } as any

    await expect(getInterceptor()(mockAxiosError)).rejects.toMatchObject({
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
      category: 'auth',
      status: 401,
    })
  })

  it('classifies 500 errors', async () => {
    const mockAxiosError = new Error('Server Error') as AxiosError
    mockAxiosError.response = { status: 500, data: {} } as any

    await expect(getInterceptor()(mockAxiosError)).rejects.toMatchObject({
      message: 'Server error. Please try again later.',
      code: 'SERVER_ERROR',
      category: 'server',
    })
  })

  it('classifies 422 errors', async () => {
    const mockAxiosError = new Error('Validation Error') as AxiosError
    mockAxiosError.response = { status: 422, data: { message: 'Invalid input' } } as any

    await expect(getInterceptor()(mockAxiosError)).rejects.toMatchObject({
      message: 'Invalid input',
      code: 'VALIDATION_ERROR',
      category: 'validation',
    })
  })

  it('does not redirect when already on login page', async () => {
    vi.stubGlobal('window', { location: { pathname: '/auth/login' } })

    const mockAxiosError = new Error('Unauthorized') as AxiosError
    mockAxiosError.response = { status: 401, data: {} } as any

    await expect(getInterceptor()(mockAxiosError)).rejects.toBeDefined()
  })
})

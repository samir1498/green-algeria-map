import axios from 'axios'
import type { AxiosError } from 'axios'
import type { AppError } from '@/shared/types/error'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

function normalizeApiError(error: AxiosError): AppError {
  const status = error.response?.status

  if (!status) {
    return {
      message: 'Unable to connect to the server. Please check your connection.',
      code: 'NETWORK_ERROR',
      category: 'network',
    }
  }

  if (status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      code: 'SERVER_ERROR',
      category: 'server',
      status,
    }
  }

  const data = error.response?.data as Record<string, unknown> | undefined
  const serverMessage = typeof data?.message === 'string' ? data.message : undefined

  if (status === 401) {
    return {
      message: serverMessage ?? 'Unauthorized',
      code: 'UNAUTHORIZED',
      category: 'auth',
      status,
    }
  }

  if (status === 403) {
    return {
      message: serverMessage ?? 'Forbidden',
      code: 'FORBIDDEN',
      category: 'auth',
      status,
    }
  }

  if (status === 422) {
    return {
      message: serverMessage ?? 'Validation failed',
      code: 'VALIDATION_ERROR',
      category: 'validation',
      status,
    }
  }

  return {
    message: serverMessage ?? `Request failed with status ${status}`,
    code: 'UNKNOWN_ERROR',
    category: 'unknown',
    status,
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const appError = normalizeApiError(error)

    if (appError.category === 'auth' && appError.status === 401) {
      const currentPath = window.location.pathname
      if (currentPath !== '/auth/login' && currentPath !== '/auth/register') {
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(appError)
  },
)

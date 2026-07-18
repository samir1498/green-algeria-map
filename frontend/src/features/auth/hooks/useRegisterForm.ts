import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

interface UseRegisterFormOptions {
  signUp: (params: {
    name: string
    email: string
    password: string
  }) => Promise<{ error?: { message: string; code?: string } | null; data?: { user?: { emailVerified?: boolean } } }>
  redirectTo?: string
  onSuccess?: () => Promise<void> | void
}

export function useRegisterForm({ signUp, redirectTo, onSuccess }: UseRegisterFormOptions) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signUp({ name, email, password })

      if (result.error) {
        toast.error(result.error.message)
        return
      }

      toast.success('Account created successfully')
      await onSuccess?.()
      if (result.data?.user?.emailVerified) {
        navigate({ to: redirectTo || '/' })
      } else {
        navigate({ to: '/auth/verify-email', search: { email } })
      }
    } catch (e) {
      console.error('useRegisterForm caught:', e)
      toast.error('Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { name, email, password, loading, handleSubmit, setName, setEmail, setPassword }
}

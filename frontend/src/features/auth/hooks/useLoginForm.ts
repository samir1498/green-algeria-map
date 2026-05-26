import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

interface UseLoginFormOptions {
  signIn: (params: {
    email: string
    password: string
  }) => Promise<{ error?: { message: string } | null }>
  redirectTo?: string
  onSuccess?: () => Promise<void> | void
}

export function useLoginForm({ signIn, redirectTo = '/', onSuccess }: UseLoginFormOptions) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn({ email, password })

      if (result.error) {
        toast.error(result.error.message)
        return
      }

      toast.success('Signed in successfully')
      await onSuccess?.()
      navigate({ to: redirectTo })
    } catch {
      toast.error('Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { email, password, loading, handleSubmit, setEmail, setPassword }
}

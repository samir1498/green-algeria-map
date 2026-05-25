import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

interface UseRegisterFormOptions {
  signUp: (params: {
    name: string
    email: string
    password: string
  }) => Promise<{ error?: { message: string } | null }>
  redirectTo?: string
}

export function useRegisterForm({ signUp, redirectTo = '/' }: UseRegisterFormOptions) {
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
      navigate({ to: redirectTo })
    } catch {
      toast.error('Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { name, email, password, loading, handleSubmit, setName, setEmail, setPassword }
}

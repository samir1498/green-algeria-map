import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

interface UseLoginFormOptions {
  signIn: (params: { email: string; password: string }) => Promise<{ error?: { message: string } | null }>
}

export function useLoginForm({ signIn }: UseLoginFormOptions) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signIn({ email, password })

    if (result.error) {
      toast.error(result.error.message)
      setLoading(false)
      return
    }

    toast.success('Signed in successfully')
    navigate({ to: '/' })
  }

  return { email, password, loading, handleSubmit, setEmail, setPassword }
}

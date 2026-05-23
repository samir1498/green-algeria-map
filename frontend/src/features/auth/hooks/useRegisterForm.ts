import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

interface UseRegisterFormOptions {
  signUp: (params: {
    name: string
    email: string
    password: string
  }) => Promise<{ error?: { message: string } | null }>
}

export function useRegisterForm({ signUp }: UseRegisterFormOptions) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signUp({ name, email, password })

    if (result.error) {
      toast.error(result.error.message)
      setLoading(false)
      return
    }

    toast.success('Account created successfully')
    setLoading(false)
    navigate({ to: '/' })
  }

  return { name, email, password, loading, handleSubmit, setName, setEmail, setPassword }
}

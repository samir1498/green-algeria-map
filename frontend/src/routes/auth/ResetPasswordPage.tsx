import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { authClient } from '@/features/auth/api/auth-client'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function ResetPasswordPage() {
  const search = useSearch({ from: '/auth/reset-password' })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    const { error: err } = await authClient.resetPassword({
      newPassword,
      token: search.token,
    })

    if (err) {
      setError(err.message ?? 'Failed to reset password')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password reset</CardTitle>
            <CardDescription>Your password has been reset successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center text-sm">
              <Link to="/auth/login" className="text-primary hover:underline">
                Sign in with your new password
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              <Link to="/auth/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

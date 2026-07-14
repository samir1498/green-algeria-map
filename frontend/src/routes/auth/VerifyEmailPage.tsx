import { useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import { authClient } from '@/features/auth/api/auth-client'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function VerifyEmailPage() {
  const search = useSearch({ from: '/auth/verify-email' })
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (search.verified) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email verified</CardTitle>
            <CardDescription>Your email has been verified successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center text-sm">
              <Link to="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleResend = async () => {
    setLoading(true)
    await authClient.sendVerificationEmail({
      email: search.email ?? '',
      callbackURL: '/auth/verify-email?verified=true',
    })
    setResent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We've sent a verification link to <strong>{search.email}</strong>. Check your inbox and
            click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!resent ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleResend}
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </Button>
          ) : (
            <p className="text-muted-foreground text-center text-sm">Verification email sent!</p>
          )}
          <p className="text-muted-foreground text-center text-sm">
            <Link to="/auth/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

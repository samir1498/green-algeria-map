import { useAuth } from '@/features/auth/hooks/useAuth'
import { authClient } from '@/features/auth/api/auth-client'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

interface ConnectedAccount {
  providerId: string
  accountId: string
}

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [linking, setLinking] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate({ to: '/auth/login' })
      return
    }
    authClient.listAccounts().then(({ data, error }: any) => {
      if (error) return
      if (data) {
        setAccounts(data.filter((a: { providerId: string }) => a.providerId !== 'credential'))
      }
    })
  }, [user, navigate])

  const handleLink = async (provider: string) => {
    setLinking(provider)
    const { error } = await authClient.linkSocial({ provider: provider as any })
    if (error) {
      toast.error(error.message ?? 'Failed to link account')
    }
    setLinking(null)
    const { data } = await authClient.listAccounts()
    if (data) {
      setAccounts(data.filter((a: { providerId: string }) => a.providerId !== 'credential'))
    }
  }

  const handleUnlink = async (providerId: string, accountId: string) => {
    const { error } = await authClient.unlinkAccount({ providerId, accountId })
    if (error) {
      toast.error(error.message ?? 'Failed to unlink account')
      return
    }
    toast.success(`${providerId} account disconnected`)
    setAccounts((prev) => prev.filter((a) => a.providerId !== providerId))
  }

  const handleResendVerification = async () => {
    if (!user) return
    const { error } = await authClient.sendVerificationEmail({
      email: user.email,
      callbackURL: '/auth/settings',
    })
    if (error) {
      toast.error(error.message ?? 'Failed to send verification email')
    } else {
      toast.success('Verification email sent')
    }
  }

  if (!user) return null

  const providers = [
    { id: 'google', label: 'Google' },
    { id: 'github', label: 'GitHub' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings and connected services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Name</p>
            <p className="text-muted-foreground text-sm">{user.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Email</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Email verified</p>
            <p className="text-muted-foreground text-sm">{user.emailVerified ? 'Yes' : 'No'}</p>
            {!user.emailVerified && (
              <Button type="button" variant="outline" size="sm" onClick={handleResendVerification}>
                Resend verification email
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Role</p>
            <p className="text-muted-foreground text-sm capitalize">{user.role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected accounts</CardTitle>
          <CardDescription>Link your social accounts for easier sign-in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((provider) => {
            const connected = accounts.find((a) => a.providerId === provider.id)
            return (
              <div key={provider.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{provider.label}</span>
                {connected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlink(connected.providerId, connected.accountId)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={linking === provider.id}
                    onClick={() => handleLink(provider.id)}
                  >
                    {linking === provider.id ? 'Connecting...' : 'Connect'}
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await signOut()
            navigate({ to: '/auth/login' })
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}

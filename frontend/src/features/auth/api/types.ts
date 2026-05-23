export type UserRole = 'volunteer' | 'reporter' | 'organizer' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  user: AuthUser
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpData extends AuthCredentials {
  name: string
}

import type { AuthUser, UserRole } from './types'

const VALID_ROLES: UserRole[] = ['volunteer', 'reporter', 'organizer', 'admin']

function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole)
}

export function mapUser(raw: Record<string, unknown>): AuthUser {
  if (typeof raw.id !== 'string') throw new Error('mapUser: id is required')
  if (typeof raw.name !== 'string') throw new Error('mapUser: name is required')
  if (typeof raw.email !== 'string') throw new Error('mapUser: email is required')
  if (typeof raw.emailVerified !== 'boolean') throw new Error('mapUser: emailVerified is required')

  const image = raw.image
  if (image !== undefined && image !== null && typeof image !== 'string') {
    throw new Error('mapUser: image must be a string or null')
  }

  const role = isValidRole(raw.role) ? raw.role : 'volunteer'

  const createdAt =
    raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt as string)
  const updatedAt =
    raw.updatedAt instanceof Date ? raw.updatedAt : new Date(raw.updatedAt as string)

  if (isNaN(createdAt.getTime())) throw new Error('mapUser: invalid createdAt')
  if (isNaN(updatedAt.getTime())) throw new Error('mapUser: invalid updatedAt')

  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    emailVerified: raw.emailVerified,
    image: (image as string | null | undefined) ?? undefined,
    role,
    createdAt,
    updatedAt,
  }
}

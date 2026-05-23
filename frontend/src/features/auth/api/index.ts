import { betterAuthService } from './auth-service.impl'
import { betterAuthSessionService } from './session-service.impl'

export { betterAuthService as authService }
export { betterAuthSessionService as sessionService }
export type { AuthUser, AuthSession, AuthCredentials, SignUpData, UserRole } from './types'
export type { AuthService } from './auth-service.interface'
export type { SessionService } from './session-service.interface'

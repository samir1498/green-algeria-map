import { betterAuthService } from './auth-service.impl'
import { betterAuthSessionService } from './session-service.impl'
import { springAuthService } from './spring-auth.service.impl'
import { springSessionService } from './spring-session.service.impl'

const backend = import.meta.env.VITE_API_BACKEND ?? 'nestjs'

/**
 * Auth service for sign-in, sign-up, sign-out.
 * Uses better-auth SDK when backend=nestjs, plain REST calls when backend=spring.
 */
export const authService = backend === 'spring' ? springAuthService : betterAuthService

/**
 * Session service for get/use session.
 * Uses better-auth SDK when backend=nestjs, plain REST calls when backend=spring.
 */
export const sessionService = backend === 'spring' ? springSessionService : betterAuthSessionService

export type { AuthUser, AuthSession, AuthCredentials, SignUpData, UserRole } from './types'
export type { AuthService } from './auth-service.interface'
export type { SessionService } from './session-service.interface'

export const ERROR_MESSAGES = {
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  USER_ALREADY_EXISTS: 'An account with this email already exists',
  EMAIL_NOT_VERIFIED: 'Please verify your email before signing in',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  INVALID_EMAIL: 'Please enter a valid email address',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later',
} as const satisfies Record<string, string>

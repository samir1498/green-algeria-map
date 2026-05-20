import { Injectable } from '@nestjs/common';
import type { AuthPort, UserSession } from './auth-port';
import { auth } from '../../auth';

export const AUTH_SERVICE = 'AUTH_SERVICE';

@Injectable()
export class BetterAuthAdapter implements AuthPort {
  async getSessionUser(token: string): Promise<UserSession | null> {
    const session = await auth.api.getSession({
      headers: { authorization: `Bearer ${token}` },
    });

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role:
        ((session.user as Record<string, unknown>).role as string) ??
        'volunteer',
      image: session.user.image,
    };
  }
}

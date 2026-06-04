import { Injectable } from '@nestjs/common';
import type { UserSession } from '../domain/auth.types';
import { auth } from '../infrastructure/better-auth.config';

@Injectable()
export class AuthService {
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

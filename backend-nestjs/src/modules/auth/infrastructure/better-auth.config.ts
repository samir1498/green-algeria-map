import { Pool } from 'pg';
import { betterAuth } from 'better-auth';
import { BrevoClient } from '../../email/brevo.client';
import {
  passwordResetTemplate,
  verificationEmailTemplate,
} from '../../email/templates';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria',
});

pool.on('error', () => {});
pool.on('connect', (client) => {
  client.query('SET search_path TO nestjs,public,extensions').catch(() => {});
});

const email = new BrevoClient();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8080',
  basePath: '/api/auth',
  database: pool,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await email.send({
        to: user.email,
        subject: 'Reset your password — Green Algeria Map',
        html: passwordResetTemplate({ name: user.name, url }),
      });
    },
    requireEmailVerification:
      process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
  },
  emailVerification: {
    sendOnSignUp: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
    sendVerificationEmail: async ({ user, url }) => {
      await email.send({
        to: user.email,
        subject: 'Verify your email — Green Algeria Map',
        html: verificationEmailTemplate({ name: user.name, url }),
      });
    },
    autoSignInAfterVerification: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: (data) => {
          if (process.env.REQUIRE_EMAIL_VERIFICATION === 'false') {
            return { data: { ...data, emailVerified: true } };
          }
        },
      },
    },
  },
  trustedOrigins: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
    : ['http://localhost:3000'],
  advanced: {
    cookies: {
      session_token: {
        attributes: {
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },
  },
  rateLimit: {
    enabled: process.env.DISABLE_RATE_LIMIT !== 'true',
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
    },
    storage: 'memory',
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'volunteer',
        input: true,
      },
    },
  },
});

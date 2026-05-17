import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8080',
  basePath: '/api/auth',
  database: new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria',
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.CLIENT_URL ?? 'http://localhost:3000'],
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

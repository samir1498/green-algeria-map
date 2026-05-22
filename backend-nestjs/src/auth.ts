import { Pool } from 'pg';
import { betterAuth } from 'better-auth';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria',
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8080',
  basePath: '/api/auth',
  database: pool,
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

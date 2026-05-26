import { Pool } from 'pg';
import { betterAuth } from 'better-auth';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('error', () => {});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8080',
  basePath: '/api/auth',
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
    : ['http://localhost:3000'],
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

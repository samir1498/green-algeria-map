import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

@Injectable()
export class PoolService implements OnApplicationShutdown {
  public readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        'postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria',
    });
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

export const poolService = new PoolService();
const pool = poolService.pool;

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

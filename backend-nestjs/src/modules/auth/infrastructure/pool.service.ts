import { Injectable, OnApplicationShutdown } from '@nestjs/common';
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

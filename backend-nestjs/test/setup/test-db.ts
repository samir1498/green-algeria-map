import { readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DB_INFO_FILE = join(tmpdir(), 'green-algeria-db-info.json');

export function getTestDbConfig(): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  if (existsSync(DB_INFO_FILE)) {
    return JSON.parse(readFileSync(DB_INFO_FILE, 'utf-8'));
  }
  return {
    host: process.env.TEST_DB_HOST ?? 'localhost',
    port: Number(process.env.TEST_DB_PORT ?? 5432),
    username: process.env.TEST_DB_USERNAME ?? 'test_greenalgeria',
    password: process.env.TEST_DB_PASSWORD ?? 'test_greenalgeria',
    database: process.env.TEST_DB_NAME ?? 'test_greenalgeria',
  };
}

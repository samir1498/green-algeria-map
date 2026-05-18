import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DB_INFO_FILE = join(tmpdir(), 'green-algeria-db-info.json');

export default async function globalTeardown(): Promise<void> {
  if (existsSync(DB_INFO_FILE)) {
    const { unlinkSync } = await import('node:fs');
    unlinkSync(DB_INFO_FILE);
  }
}

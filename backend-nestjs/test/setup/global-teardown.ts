import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DB_INFO_FILE = join(tmpdir(), 'green-algeria-db-info.json');

export default function globalTeardown(): void {
  rmSync(DB_INFO_FILE, { force: true });
}

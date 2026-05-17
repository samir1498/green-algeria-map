import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DB_INFO_FILE = join(tmpdir(), 'green-algeria-db-info.json');

export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:18-alpine')
    .withDatabase('test_greenalgeria')
    .withUsername('test_greenalgeria')
    .withPassword('test_greenalgeria')
    .withExposedPorts(5432)
    .start();

  writeFileSync(
    DB_INFO_FILE,
    JSON.stringify({
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    }),
  );
}

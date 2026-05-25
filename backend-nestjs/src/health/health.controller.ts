import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { Public } from '@/modules/auth/infrastructure/public.decorator';
import { StorageHealthIndicator } from './storage-health.indicator';

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private storage: StorageHealthIndicator,
  ) {}

  @Get(['live', 'healthz', 'api/health/live'])
  @Public()
  live() {
    return { status: 'ok' };
  }

  @Get(['ready', 'readyz', 'api/health/ready', 'api/health'])
  @HealthCheck()
  @Public()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
      () => this.storage.isHealthy('storage'),
    ]);
  }
}

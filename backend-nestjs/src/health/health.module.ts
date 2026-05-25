import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { StorageHealthIndicator } from './storage-health.indicator';

@Module({
  imports: [TerminusModule, ConfigModule, HttpModule],
  controllers: [HealthController],
  providers: [StorageHealthIndicator],
})
export class HealthModule {}

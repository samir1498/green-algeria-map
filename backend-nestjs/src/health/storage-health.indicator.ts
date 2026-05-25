import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import axios from 'axios';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const endpoint = this.configService.get<string>(
      'OO_OBJECT_STORAGE_ENDPOINT',
    );
    const bucket = this.configService.get<string>('OO_OBJECT_STORAGE_BUCKET');

    if (!endpoint || !bucket) {
      return this.getStatus(key, false, { message: 'Storage not configured' });
    }

    try {
      const url = `${endpoint.replace(/\/+$/, '')}/${bucket}`;
      await axios.head(url, { timeout: 5000 });
      return this.getStatus(key, true);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return this.getStatus(key, true, {
          note: `Reachable (HTTP ${error.response.status})`,
        });
      }
      return this.getStatus(key, false, {
        message:
          error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

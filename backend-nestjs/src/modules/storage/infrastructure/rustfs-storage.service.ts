import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import axios from 'axios';
import pRetry from 'p-retry';
import { StorageService } from '../domain/storage.service';
import { UploadFileError } from '../domain/storage.errors';
import { signS3Put } from './s3-signing.util';

@Injectable()
export class RustFsStorageService implements StorageService {
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  private get endpoint(): string {
    return this.configService.get<string>('OO_OBJECT_STORAGE_ENDPOINT') ?? '';
  }

  private get bucket(): string {
    return this.configService.get<string>('OO_OBJECT_STORAGE_BUCKET') ?? '';
  }

  private get accessKey(): string {
    return this.configService.get<string>('OO_OBJECT_STORAGE_ACCESS_KEY') ?? '';
  }

  private get secretKey(): string {
    return this.configService.get<string>('OO_OBJECT_STORAGE_SECRET_KEY') ?? '';
  }

  private get region(): string {
    return (
      this.configService.get<string>('OO_OBJECT_STORAGE_REGION') ?? 'us-east-1'
    );
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ fileId: string; url: string }> {
    if (!this.endpoint)
      throw new UploadFileError('Missing OO_OBJECT_STORAGE_ENDPOINT');
    if (!this.bucket)
      throw new UploadFileError('Missing OO_OBJECT_STORAGE_BUCKET');
    if (!this.accessKey)
      throw new UploadFileError('Missing OO_OBJECT_STORAGE_ACCESS_KEY');
    if (!this.secretKey)
      throw new UploadFileError('Missing OO_OBJECT_STORAGE_SECRET_KEY');

    try {
      const uniqueKey = `${randomUUID()}-${filename}`;
      const signedHeaders = signS3Put(
        this.endpoint,
        this.bucket,
        uniqueKey,
        file,
        mimetype,
        this.accessKey,
        this.secretKey,
        this.region,
      );

      const url = `${this.endpoint}/${this.bucket}/${uniqueKey}`;
      const response = await pRetry(
        () =>
          axios.put(url, file, {
            headers: signedHeaders,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }),
        {
          retries: 3,
          minTimeout: 1_000,
          maxTimeout: 5_000,
        },
      );

      if (response.status !== 200) {
        throw new UploadFileError(
          `Unexpected status ${response.status} from RustFS`,
        );
      }

      const downloadUrl = `${this.endpoint}/${this.bucket}/${uniqueKey}`;
      return { fileId: uniqueKey, url: downloadUrl };
    } catch (error) {
      throw new UploadFileError(
        `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getFileUrl(fileId: string): string {
    return `${this.endpoint}/${this.bucket}/${fileId}`;
  }
}

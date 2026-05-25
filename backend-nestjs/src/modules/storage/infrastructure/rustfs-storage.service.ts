import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import axios from 'axios';
import { StorageService } from '../domain/storage.service';
import { UploadFileError } from '../domain/storage.errors';
import { signS3Put } from './s3-signing.util';

@Injectable()
export class RustFsStorageService implements StorageService {
  private readonly rustfsEndpoint: string;
  private readonly bucket: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>(
      'OO_OBJECT_STORAGE_ENDPOINT',
    );
    const bucket = this.configService.get<string>('OO_OBJECT_STORAGE_BUCKET');
    const accessKey = this.configService.get<string>(
      'OO_OBJECT_STORAGE_ACCESS_KEY',
    );
    const secretKey = this.configService.get<string>(
      'OO_OBJECT_STORAGE_SECRET_KEY',
    );

    if (!endpoint) throw new Error('Missing OO_OBJECT_STORAGE_ENDPOINT');
    if (!bucket) throw new Error('Missing OO_OBJECT_STORAGE_BUCKET');
    if (!accessKey) throw new Error('Missing OO_OBJECT_STORAGE_ACCESS_KEY');
    if (!secretKey) throw new Error('Missing OO_OBJECT_STORAGE_SECRET_KEY');

    this.rustfsEndpoint = endpoint.replace(/\/+$/, '');
    this.bucket = bucket;
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.region =
      this.configService.get<string>('OO_OBJECT_STORAGE_REGION') ?? 'us-east-1';
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ fileId: string; url: string }> {
    try {
      const uniqueKey = `${randomUUID()}-${filename}`;
      const signedHeaders = signS3Put(
        this.rustfsEndpoint,
        this.bucket,
        uniqueKey,
        file,
        mimetype,
        this.accessKey,
        this.secretKey,
        this.region,
      );

      const url = `${this.rustfsEndpoint}/${this.bucket}/${uniqueKey}`;
      const response = await axios.put(url, file, {
        headers: signedHeaders,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (response.status !== 200) {
        throw new UploadFileError(
          `Unexpected status ${response.status} from RustFS`,
        );
      }

      const downloadUrl = `${this.rustfsEndpoint}/${this.bucket}/${uniqueKey}`;
      return { fileId: uniqueKey, url: downloadUrl };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new UploadFileError(`Failed to upload file: ${error.message}`);
      }
      throw error;
    }
  }

  getFileUrl(fileId: string): string {
    return `${this.rustfsEndpoint}/${this.bucket}/${fileId}`;
  }
}

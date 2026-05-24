import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    this.rustfsEndpoint = this.configService
      .get<string>('OO_OBJECT_STORAGE_ENDPOINT')!
      .replace(/\/+$/, '');
    this.bucket = this.configService.get<string>('OO_OBJECT_STORAGE_BUCKET')!;
    this.accessKey = this.configService.get<string>(
      'OO_OBJECT_STORAGE_ACCESS_KEY',
    )!;
    this.secretKey = this.configService.get<string>(
      'OO_OBJECT_STORAGE_SECRET_KEY',
    )!;
    this.region =
      this.configService.get<string>('OO_OBJECT_STORAGE_REGION') ?? 'us-east-1';
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ fileId: string; url: string }> {
    try {
      const signedHeaders = signS3Put(
        this.rustfsEndpoint,
        this.bucket,
        filename,
        file,
        mimetype,
        this.accessKey,
        this.secretKey,
        this.region,
      );

      const url = `${this.rustfsEndpoint}/${this.bucket}/${filename}`;
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

      const fileId = filename;
      const downloadUrl = `${this.rustfsEndpoint}/${this.bucket}/${fileId}`;
      return { fileId, url: downloadUrl };
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

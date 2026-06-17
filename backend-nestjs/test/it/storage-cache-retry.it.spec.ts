import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import axios from 'axios';
import { RustFsStorageService } from '../../src/modules/storage/infrastructure/rustfs-storage.service';
import { UploadFileError } from '../../src/modules/storage/domain/storage.errors';

describe('Storage retry (integration)', () => {
  let app: INestApplication;
  let service: RustFsStorageService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({ isGlobal: true, ttl: 300_000, max: 500 }),
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              OO_OBJECT_STORAGE_ENDPOINT: 'http://localhost:9000',
              OO_OBJECT_STORAGE_REGION: 'us-east-1',
              OO_OBJECT_STORAGE_BUCKET: 'test-bucket',
              OO_OBJECT_STORAGE_ACCESS_KEY: 'test-access-key',
              OO_OBJECT_STORAGE_SECRET_KEY: 'test-secret-key',
            }),
          ],
        }),
      ],
      providers: [RustFsStorageService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    service = module.get(RustFsStorageService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('uploadFile retry behavior', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should retry on transient axios failure and succeed', async () => {
      const file = Buffer.from('test-content');
      const fileName = 'test.jpg';
      const mimeType = 'image/jpeg';

      const mockPut = vi
        .spyOn(axios, 'put')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue({ status: 200, data: {} });

      vi.spyOn(axios, 'put');

      (axios.put as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (url: string, _data: Buffer, config?: Record<string, unknown>) => {
          const callCount = mockPut.mock.results.length;
          if (callCount === 0) return Promise.reject(new Error('Network error'));
          if (callCount === 1) return Promise.reject(new Error('Timeout'));
          return Promise.resolve({ status: 200, data: {} });
        },
      );

      const result = await service.uploadFile(file, fileName, mimeType);

      expect(result).toHaveProperty('fileId');
      expect(result).toHaveProperty('url');
    }, 30_000);

    it('should throw UploadFileError after exhausting retries', async () => {
      const file = Buffer.from('test-content');
      const fileName = 'test.jpg';
      const mimeType = 'image/jpeg';

      vi.spyOn(axios, 'put').mockRejectedValue(new Error('Persistent error'));

      await expect(service.uploadFile(file, fileName, mimeType)).rejects.toThrow(
        UploadFileError,
      );
    }, 30_000);

    it('should wrap non-Axios errors in UploadFileError', async () => {
      const file = Buffer.from('test-content');
      const fileName = 'test.jpg';
      const mimeType = 'image/jpeg';

      vi.spyOn(axios, 'put').mockRejectedValue(new Error('Non-axios error'));

      await expect(service.uploadFile(file, fileName, mimeType)).rejects.toThrow(
        UploadFileError,
      );
    }, 30_000);
  });
});

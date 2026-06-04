import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { RustFsStorageService } from './infrastructure/rustfs-storage.service';
import { StorageController } from './storage.controller';
import { UploadZonePhotoService } from './application/upload-zone-photo.service';
import { STORAGE_SERVICE } from './tokens';

@Module({
  imports: [ConfigModule, CqrsModule],
  controllers: [StorageController],
  providers: [
    UploadZonePhotoService,
    {
      provide: STORAGE_SERVICE,
      useClass: RustFsStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}

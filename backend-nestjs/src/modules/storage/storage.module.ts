import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { RustFsStorageService } from './infrastructure/rustfs-storage.service';
import { StorageController } from './storage.controller';
import { STORAGE_SERVICE } from './tokens';
import { UploadZonePhotoUseCase } from './application/upload-zone-photo.usecase';

@Module({
  imports: [ConfigModule, CqrsModule],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: RustFsStorageService,
    },
    UploadZonePhotoUseCase,
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RustFsStorageService } from './infrastructure/rustfs-storage.service';
import { StorageController } from './storage.controller';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: RustFsStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}

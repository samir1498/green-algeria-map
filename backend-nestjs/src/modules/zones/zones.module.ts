import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneOrmEntity } from './infrastructure/zone.orm-entity';
import { ZoneRepositoryImpl } from './infrastructure/zone.repository.impl';
import { ZoneRepository } from './domain/zone.repository';
import { GetAllZonesUseCase } from './application/get-all-zones.use-case';
import { GetZoneByIdUseCase } from './application/get-zone-by-id.use-case';
import { CreateZoneUseCase } from './application/create-zone.use-case';
import { UpdateZoneUseCase } from './application/update-zone.use-case';
import { DeleteZoneUseCase } from './application/delete-zone.use-case';
import { ZonesController } from './zones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity])],
  controllers: [ZonesController],
  providers: [
    {
      provide: ZoneRepository,
      useClass: ZoneRepositoryImpl,
    },
    GetAllZonesUseCase,
    GetZoneByIdUseCase,
    CreateZoneUseCase,
    UpdateZoneUseCase,
    DeleteZoneUseCase,
  ],
})
export class ZonesModule {}

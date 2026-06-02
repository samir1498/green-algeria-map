import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ZoneOrmEntity } from './infrastructure/zone.orm-entity';
import { ZoneRepository } from './infrastructure/zone.repository';
import { CreateZoneHandler } from './application/commands/create-zone.handler';
import { UpdateZoneHandler } from './application/commands/update-zone.handler';
import { DeleteZoneHandler } from './application/commands/delete-zone.handler';
import { GetAllZonesHandler } from './application/queries/get-all-zones.handler';
import { GetZoneByIdHandler } from './application/queries/get-zone-by-id.handler';
import { ZoneCreatedHandler } from './application/events/zone-created.handler';
import { AddPhotoToZoneHandler } from './application/commands/add-photo-to-zone.handler';
import { RegisterVolunteerHandler } from './application/commands/register-volunteer.handler';
import { ZonesController } from './zones.controller';

const CommandHandlers = [
  CreateZoneHandler,
  UpdateZoneHandler,
  DeleteZoneHandler,
  AddPhotoToZoneHandler,
  RegisterVolunteerHandler,
];
const QueryHandlers = [GetAllZonesHandler, GetZoneByIdHandler];
const EventHandlers = [ZoneCreatedHandler];

@Module({
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity]), CqrsModule],
  controllers: [ZonesController],
  providers: [
    ZoneRepository,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
})
export class ZonesModule {}

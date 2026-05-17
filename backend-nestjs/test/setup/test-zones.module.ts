import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ZoneOrmEntity } from '../../src/modules/zones/infrastructure/zone.orm-entity';
import { ZoneRepositoryImpl } from '../../src/modules/zones/infrastructure/zone.repository.impl';
import { ZoneRepository } from '../../src/modules/zones/domain/zone.repository';
import { CreateZoneHandler } from '../../src/modules/zones/application/commands/create-zone.handler';
import { UpdateZoneHandler } from '../../src/modules/zones/application/commands/update-zone.handler';
import { DeleteZoneHandler } from '../../src/modules/zones/application/commands/delete-zone.handler';
import { GetAllZonesHandler } from '../../src/modules/zones/application/queries/get-all-zones.handler';
import { GetZoneByIdHandler } from '../../src/modules/zones/application/queries/get-zone-by-id.handler';
import { ZoneCreatedHandler } from '../../src/modules/zones/application/events/zone-created.handler';

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { CreateZoneCommand } from '../../src/modules/zones/application/commands/create-zone.command';
import { UpdateZoneCommand } from '../../src/modules/zones/application/commands/update-zone.command';
import { DeleteZoneCommand } from '../../src/modules/zones/application/commands/delete-zone.command';
import { GetAllZonesQuery } from '../../src/modules/zones/application/queries/get-all-zones.query';
import { GetZoneByIdQuery } from '../../src/modules/zones/application/queries/get-zone-by-id.query';
import { CreateZoneDto } from '../../src/modules/zones/dto/create-zone.dto';
import { UpdateZoneDto } from '../../src/modules/zones/dto/update-zone.dto';

@Controller('zones')
@ApiTags('Zones')
class TestZonesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  findAll() {
    return this.queryBus.execute(new GetAllZonesQuery());
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryBus.execute(new GetZoneByIdQuery(id));
  }

  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.commandBus.execute(
      new CreateZoneCommand(
        dto.name,
        dto.type,
        dto.status,
        dto.lat,
        dto.lng,
        dto.targetCount,
        dto.currentCount,
        dto.description,
      ),
    );
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateZoneDto) {
    return this.commandBus.execute(
      new UpdateZoneCommand(
        id,
        dto.name,
        dto.type,
        dto.status,
        dto.lat,
        dto.lng,
        dto.targetCount,
        dto.currentCount,
        dto.description,
      ),
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.commandBus.execute(new DeleteZoneCommand(id));
  }
}

const CommandHandlers = [
  CreateZoneHandler,
  UpdateZoneHandler,
  DeleteZoneHandler,
];
const QueryHandlers = [GetAllZonesHandler, GetZoneByIdHandler];
const EventHandlers = [ZoneCreatedHandler];

@Module({
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity]), CqrsModule],
  controllers: [TestZonesController],
  providers: [
    {
      provide: ZoneRepository,
      useClass: ZoneRepositoryImpl,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
})
export class TestZonesModule {}

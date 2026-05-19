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
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ApiTags } from '@nestjs/swagger';
import { CreateZoneCommand } from './application/commands/create-zone.command';
import { UpdateZoneCommand } from './application/commands/update-zone.command';
import { DeleteZoneCommand } from './application/commands/delete-zone.command';
import { GetAllZonesQuery } from './application/queries/get-all-zones.query';
import { GetZoneByIdQuery } from './application/queries/get-zone-by-id.query';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @AllowAnonymous()
  findAll() {
    return this.queryBus.execute(new GetAllZonesQuery());
  }

  @Get(':id')
  @AllowAnonymous()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryBus.execute(new GetZoneByIdQuery(id));
  }

  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.commandBus.execute(
      new CreateZoneCommand(
        dto.name,
        dto.type,
        dto.lat,
        dto.lng,
        dto.status,
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

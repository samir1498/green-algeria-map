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
import { Public } from '../auth/infrastructure/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { CreateZoneCommand } from './application/commands/create-zone/create-zone.command';
import { UpdateZoneCommand } from './application/commands/update-zone/update-zone.command';
import { DeleteZoneCommand } from './application/commands/delete-zone/delete-zone.command';
import { GetAllZonesQuery } from './application/queries/get-all-zones/get-all-zones.query';
import { GetZoneByIdQuery } from './application/queries/get-zone-by-id/get-zone-by-id.query';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZoneResponseDto } from './dto/zone-response.dto';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Public()
  async findAll() {
    const zones = await this.queryBus.execute(new GetAllZonesQuery());
    return zones.map((z) => ZoneResponseDto.fromDomain(z));
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const zone = await this.queryBus.execute(new GetZoneByIdQuery(id));
    return ZoneResponseDto.fromDomain(zone);
  }

  @Post()
  async create(@Body() dto: CreateZoneDto) {
    const zone = await this.commandBus.execute(
      new CreateZoneCommand(
        dto.name,
        dto.type,
        dto.lat,
        dto.lng,
        dto.status,
        dto.targetCount,
        dto.currentCount,
        dto.description,
        dto.organizerContact,
      ),
    );
    return ZoneResponseDto.fromDomain(zone);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    const zone = await this.commandBus.execute(
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
        dto.organizerContact,
      ),
    );
    return ZoneResponseDto.fromDomain(zone);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.commandBus.execute(new DeleteZoneCommand(id));
  }
}

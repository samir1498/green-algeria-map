import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ApiTags } from '@nestjs/swagger';
import { GetAllZonesUseCase } from './application/get-all-zones.use-case';
import { GetZoneByIdUseCase } from './application/get-zone-by-id.use-case';
import { CreateZoneUseCase } from './application/create-zone.use-case';
import { UpdateZoneUseCase } from './application/update-zone.use-case';
import { DeleteZoneUseCase } from './application/delete-zone.use-case';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(
    private readonly getAllZones: GetAllZonesUseCase,
    private readonly getZoneById: GetZoneByIdUseCase,
    private readonly createZone: CreateZoneUseCase,
    private readonly updateZone: UpdateZoneUseCase,
    private readonly deleteZone: DeleteZoneUseCase,
  ) {}

  @Get()
  @AllowAnonymous()
  findAll() {
    return this.getAllZones.execute();
  }

  @Get(':id')
  @AllowAnonymous()
  findOne(@Param('id') id: string) {
    return this.getZoneById.execute(id);
  }

  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.createZone.execute(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.updateZone.execute(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deleteZone.execute(id);
  }
}

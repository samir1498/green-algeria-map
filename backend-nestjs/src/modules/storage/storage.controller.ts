import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  HttpException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { StorageService } from './domain/storage.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AddPhotoToZoneCommand } from '../zones/application/commands/add-photo-to-zone.command';
import { GetZoneByIdQuery } from '../zones/application/queries/get-zone-by-id.query';
import { UploadFileDto } from './dto/upload-file.dto';
import { STORAGE_SERVICE } from './tokens';
import { UploadFileError } from './domain/storage.errors';
import type { FastifyRequest } from 'fastify';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('zones/:id/photo')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Photo file to upload for a zone',
    type: UploadFileDto,
  })
  async uploadZonePhoto(
    @Param('id', ParseUUIDPipe) zoneId: string,
    @Req() req: FastifyRequest,
  ) {
    let file;
    try {
      file = await req.file();
    } catch {
      throw new BadRequestException('No file uploaded');
    }
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    await this.queryBus.execute(new GetZoneByIdQuery(zoneId));

    const buffer = await file.toBuffer();
    const { filename, mimetype } = file;

    try {
      const { url: photoUrl } = await this.storageService.uploadFile(
        buffer,
        filename,
        mimetype,
      );

      await this.commandBus.execute(
        new AddPhotoToZoneCommand(zoneId, photoUrl),
      );

      return { photoUrl };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof UploadFileError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw error;
    }
  }
}

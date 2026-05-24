import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  ParseUUIDPipe,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { StorageService } from './domain/storage.service';
import { CommandBus } from '@nestjs/cqrs';
import { AddPhotoToZoneCommand } from '../zones/application/commands/add-photo-to-zone/add-photo-to-zone.command';
import { UploadFileDto } from './dto/upload-file.dto';
import type { Express } from 'express';
import { STORAGE_SERVICE } from './storage.module';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('zones/:id/photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Photo file to upload for a zone',
    type: UploadFileDto,
  })
  async uploadZonePhoto(
    @Param('id', ParseUUIDPipe) zoneId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { buffer, originalname, mimetype } = file;

    try {
      const { url: photoUrl } = await this.storageService.uploadFile(
        buffer,
        originalname,
        mimetype,
      );

      // Update the zone with the new photo URL
      await this.commandBus.execute(
        new AddPhotoToZoneCommand(zoneId, photoUrl),
      );

      return { photoUrl };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

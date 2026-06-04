import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadFileDto } from './dto/upload-file.dto';
import type { Express } from 'express';
import { UploadZonePhotoUseCase } from './application/upload-zone-photo.usecase';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(
    private readonly uploadZonePhotoUseCase: UploadZonePhotoUseCase,
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
    return this.uploadZonePhotoUseCase.execute(zoneId, file);
  }
}

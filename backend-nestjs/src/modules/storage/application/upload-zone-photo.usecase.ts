import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetZoneByIdQuery } from '../../zones/application/queries/get-zone-by-id.query';
import { AddPhotoToZoneCommand } from '../../zones/application/commands/add-photo-to-zone.command';
import type { StorageService } from '../domain/storage.service';
import { STORAGE_SERVICE } from '../tokens';
import { UploadFileError } from '../domain/storage.errors';
import type { Express } from 'express';

@Injectable()
export class UploadZonePhotoUseCase {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    zoneId: string,
    file: Express.Multer.File,
  ): Promise<{ photoUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    await this.queryBus.execute(new GetZoneByIdQuery(zoneId));

    const { buffer, originalname, mimetype } = file;

    try {
      const { url: photoUrl } = await this.storageService.uploadFile(
        buffer,
        originalname,
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

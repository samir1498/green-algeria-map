import { IsOptional } from 'class-validator';

export class UploadFileDto {
  file: Express.Multer.File;

  @IsOptional()
  folder?: string;
}

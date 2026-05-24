import { DomainError } from '@/lib/domain-error';

export class StorageError extends DomainError {
  readonly category = 'storage';

  constructor(message: string) {
    super(`StorageError: ${message}`);
  }
}

export class UploadFileError extends StorageError {
  constructor(message: string) {
    super(`UploadFileError: ${message}`);
  }
}

export class FileNotFoundError extends StorageError {
  constructor(fileId: string) {
    super(`File not found: ${fileId}`);
  }
}

import { DomainError } from '@/lib/domain-error';

class StorageError extends DomainError {
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

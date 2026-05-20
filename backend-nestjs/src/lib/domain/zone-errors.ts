import { DomainError } from './domain-error';

export class CannotStartZoneError extends DomainError {
  readonly category = 'validation';

  constructor(status: string) {
    super(`Cannot start zone: current status is "${status}"`);
  }
}

export class CannotCompleteZoneError extends DomainError {
  readonly category = 'validation';

  constructor(current: number, target?: number) {
    super(
      `Cannot complete zone: target not reached (${current}/${target ?? 'N/A'})`,
    );
  }
}

export class NegativeCountError extends DomainError {
  readonly category = 'validation';

  constructor() {
    super('Count cannot be negative');
  }
}

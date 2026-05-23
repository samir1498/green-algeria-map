import { DomainError } from '@/lib/domain-error';

export class InvalidDamageReportTypeError extends DomainError {
  readonly category = 'validation';

  constructor(type: string) {
    super(`Invalid damage report type: ${type}`);
  }
}

export class InvalidDamageReportSeverityError extends DomainError {
  readonly category = 'validation';

  constructor(severity: string) {
    super(`Invalid damage report severity: ${severity}`);
  }
}

export class InvalidDamageReportStatusError extends DomainError {
  readonly category = 'validation';

  constructor(status: string) {
    super(`Invalid damage report status: ${status}`);
  }
}

export class InvalidStatusTransitionError extends DomainError {
  readonly category = 'validation';

  constructor(from: string, to: string) {
    super(`Cannot change status from '${from}' to '${to}'`);
  }
}

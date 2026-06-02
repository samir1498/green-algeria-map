import { Query } from '@nestjs/cqrs';
import { DamageReport } from '../../domain/damage-report';

export class GetDamageReportByIdQuery extends Query<DamageReport> {
  constructor(readonly id: string) {
    super();
  }
}

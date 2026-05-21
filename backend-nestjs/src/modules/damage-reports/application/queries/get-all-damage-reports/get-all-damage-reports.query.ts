import { Query } from '@nestjs/cqrs';
import { DamageReport } from '../../../domain/damage-report';

export class GetAllDamageReportsQuery extends Query<DamageReport[]> {
  constructor(readonly zoneId?: string) {
    super();
  }
}

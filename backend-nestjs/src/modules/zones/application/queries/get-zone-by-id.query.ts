import { Query } from '@nestjs/cqrs';
import { Zone } from '../../domain/zone';

export class GetZoneByIdQuery extends Query<Zone> {
  constructor(readonly id: string) {
    super();
  }
}

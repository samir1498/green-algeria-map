import { Query } from '@nestjs/cqrs';
import { Zone } from '../../../domain/zone';

export class GetAllZonesQuery extends Query<Zone[]> {}

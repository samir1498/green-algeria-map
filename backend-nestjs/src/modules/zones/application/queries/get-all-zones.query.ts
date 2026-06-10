import { Query } from '@nestjs/cqrs';
import { ZoneResponseDto } from '../../dto/zone-response.dto';

export class GetAllZonesQuery extends Query<ZoneResponseDto[]> {}

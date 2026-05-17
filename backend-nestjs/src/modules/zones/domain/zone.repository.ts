import { Zone } from './zone';

export abstract class ZoneRepository {
  abstract findAll(): Promise<Zone[]>;
  abstract findById(id: string): Promise<Zone | null>;
  abstract save(zone: Zone): Promise<Zone>;
  abstract remove(id: string): Promise<void>;
  abstract existsByName(name: string): Promise<boolean>;
}

import { ZoneType, ZoneStatus } from './zone.types';
import { Coordinates } from './coordinates.value-object';
import {
  CannotStartZoneError,
  CannotCompleteZoneError,
  NegativeCountError,
} from '../../../lib/domain/zone-errors';

export interface ZoneProps {
  id?: string;
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  coordinates: Coordinates;
  targetCount?: number;
  currentCount?: number;
  description: string;
}

export class Zone {
  readonly id?: string;
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  coordinates: Coordinates;
  targetCount?: number;
  currentCount?: number;
  description: string;

  private constructor(props: ZoneProps) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.status = props.status;
    this.coordinates = props.coordinates;
    this.targetCount = props.targetCount;
    this.currentCount = props.currentCount ?? 0;
    this.description = props.description;
  }

  static create(props: ZoneProps): Zone {
    return new Zone(props);
  }

  rename(name: string): void {
    this.name = name;
  }

  updateType(type: ZoneType): void {
    this.type = type;
  }

  reposition(lat: number, lng: number): void {
    this.coordinates = new Coordinates(lat, lng);
  }

  canStart(): boolean {
    return this.status === 'planned';
  }

  markInProgress(): void {
    this.changeStatus('in-progress');
  }

  changeStatus(status: ZoneStatus): void {
    if (status === 'in-progress' && !this.canStart()) {
      throw new CannotStartZoneError(this.status);
    }
    if (status === 'completed' && !this.canComplete()) {
      throw new CannotCompleteZoneError(
        this.currentCount ?? 0,
        this.targetCount,
      );
    }
    this.status = status;
  }

  canComplete(): boolean {
    if (this.status === 'completed') return false;
    if (this.targetCount !== undefined && this.currentCount !== undefined) {
      return this.currentCount >= this.targetCount;
    }
    return true;
  }

  markComplete(): void {
    this.changeStatus('completed');
  }

  updateProgress(count: number): void {
    if (count < 0) {
      throw new NegativeCountError();
    }
    this.currentCount = count;
    if (this.canComplete()) {
      this.markComplete();
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      lat: this.coordinates.lat,
      lng: this.coordinates.lng,
      targetCount: this.targetCount,
      currentCount: this.currentCount,
      description: this.description,
    };
  }
}

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
  coordinates: Coordinates;
  private _name: string;
  private _type: ZoneType;
  private _status: ZoneStatus;
  private _targetCount?: number;
  private _currentCount: number;
  private _description: string;

  get name(): string {
    return this._name;
  }

  get type(): ZoneType {
    return this._type;
  }

  get status(): ZoneStatus {
    return this._status;
  }

  get targetCount(): number | undefined {
    return this._targetCount;
  }

  get currentCount(): number {
    return this._currentCount;
  }

  get description(): string {
    return this._description;
  }

  private constructor(props: ZoneProps) {
    this.id = props.id;
    this._name = props.name;
    this._type = props.type;
    this._status = props.status;
    this.coordinates = props.coordinates;
    this._targetCount = props.targetCount;
    this._currentCount = props.currentCount ?? 0;
    this._description = props.description;
  }

  static create(props: ZoneProps): Zone {
    return new Zone(props);
  }

  rename(name: string): void {
    this._name = name;
  }

  updateType(type: ZoneType): void {
    this._type = type;
  }

  updateDescription(description: string): void {
    this._description = description;
  }

  updateTargetCount(targetCount: number): void {
    this._targetCount = targetCount;
  }

  reposition(lat: number, lng: number): void {
    this.coordinates = new Coordinates(lat, lng);
  }

  canStart(): boolean {
    return this._status === 'planned';
  }

  markInProgress(): void {
    this.changeStatus('in-progress');
  }

  changeStatus(status: ZoneStatus): void {
    if (status === 'in-progress' && !this.canStart()) {
      throw new CannotStartZoneError(this._status);
    }
    if (status === 'completed' && !this.canComplete()) {
      throw new CannotCompleteZoneError(this._currentCount, this._targetCount);
    }
    this._status = status;
  }

  canComplete(): boolean {
    if (this._status === 'completed') return false;
    if (this._targetCount !== undefined && this._currentCount !== undefined) {
      return this._currentCount >= this._targetCount;
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
    this._currentCount = count;
    if (this.canComplete()) {
      this.markComplete();
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this._name,
      type: this._type,
      status: this._status,
      lat: this.coordinates.lat,
      lng: this.coordinates.lng,
      targetCount: this._targetCount,
      currentCount: this._currentCount,
      description: this._description,
    };
  }
}

import { ZoneType, ZoneStatus } from './zone.types';
import { Coordinates } from './coordinates.value-object';

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

  canStart(): boolean {
    return this.status === 'planned';
  }

  markInProgress(): void {
    if (!this.canStart()) {
      throw new Error(`Cannot start zone: current status is "${this.status}"`);
    }
    this.status = 'in-progress';
  }

  canComplete(): boolean {
    if (this.status === 'completed') return false;
    if (this.targetCount !== undefined && this.currentCount !== undefined) {
      return this.currentCount >= this.targetCount;
    }
    return true;
  }

  markComplete(): void {
    if (!this.canComplete()) {
      throw new Error(
        `Cannot complete zone: target not reached (${this.currentCount}/${this.targetCount})`,
      );
    }
    this.status = 'completed';
  }

  updateProgress(count: number): void {
    if (count < 0) {
      throw new Error('Count cannot be negative');
    }
    this.currentCount = count;
    if (this.canComplete()) {
      this.markComplete();
    }
  }
}

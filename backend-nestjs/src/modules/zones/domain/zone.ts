import { ZoneType, ZoneStatus } from './zone.types';
import { Coordinates } from './coordinates.value-object';
import {
  CannotStartZoneError,
  CannotCompleteZoneError,
  NegativeCountError,
} from './zone-errors';

export interface ZoneProps {
  id?: string;
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  coordinates: Coordinates;
  targetCount?: number;
  currentCount?: number;
  description: string;
  photos?: string[];
  organizerContact?: string;
  treeSpecies?: string;
  volunteerCount?: number;
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
  private _photos: string[];
  private _organizerContact?: string;
  private _treeSpecies?: string;
  private _volunteerCount: number;

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

  get photos(): string[] {
    return [...this._photos];
  }

  get organizerContact(): string | undefined {
    return this._organizerContact;
  }

  get treeSpecies(): string | undefined {
    return this._treeSpecies;
  }

  get volunteerCount(): number {
    return this._volunteerCount;
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
    this._photos = props.photos ? [...props.photos] : [];
    this._organizerContact = props.organizerContact;
    this._treeSpecies = props.treeSpecies;
    this._volunteerCount = props.volunteerCount ?? 0;
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

  updateOrganizerContact(contact: string | undefined): void {
    this._organizerContact = contact;
  }

  updateTreeSpecies(species: string | undefined): void {
    this._treeSpecies = species;
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

  registerVolunteer(): void {
    this._volunteerCount += 1;
  }

  addPhoto(photoUrl: string): void {
    if (!photoUrl || !photoUrl.trim()) return;
    if (this._photos.includes(photoUrl)) return;
    try {
      new URL(photoUrl);
    } catch {
      return;
    }
    this._photos.push(photoUrl);
  }

  removePhoto(photoUrl: string): void {
    this._photos = this._photos.filter((url) => url !== photoUrl);
  }
}

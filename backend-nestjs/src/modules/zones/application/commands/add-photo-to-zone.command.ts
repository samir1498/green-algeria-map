import { Command } from '@nestjs/cqrs';

export class AddPhotoToZoneCommand extends Command<void> {
  constructor(
    readonly zoneId: string,
    readonly photoUrl: string,
  ) {
    super();
  }
}

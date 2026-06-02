import { Command } from '@nestjs/cqrs';

export class RegisterVolunteerCommand extends Command<void> {
  constructor(readonly zoneId: string) {
    super();
  }
}

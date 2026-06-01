import { Command } from '@nestjs/cqrs';

export class DeleteZoneCommand extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

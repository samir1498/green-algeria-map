import { Command } from '@nestjs/cqrs';

export class DeleteDamageReportCommand extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

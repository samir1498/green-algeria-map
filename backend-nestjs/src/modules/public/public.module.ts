import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PublicController } from './public.controller';

@Module({
  imports: [CqrsModule],
  controllers: [PublicController],
})
export class PublicModule {}

import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AuditModule, SubscriptionsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}

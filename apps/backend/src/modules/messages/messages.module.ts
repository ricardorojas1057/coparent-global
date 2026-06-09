import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuditModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}

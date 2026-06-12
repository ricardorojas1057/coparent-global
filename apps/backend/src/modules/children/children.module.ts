import { Module } from '@nestjs/common';
import { ChildrenService } from './children.service';
import { ChildrenController } from './children.controller';
import { AuditModule } from '../audit/audit.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({ imports: [AuditModule, SubscriptionsModule], providers: [ChildrenService], controllers: [ChildrenController] })
export class ChildrenModule {}

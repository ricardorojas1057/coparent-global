import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { GooglePlayBillingService } from './google-play-billing.service';
import { GooglePlayNotificationsController } from './google-play-notifications.controller';

@Module({
  imports: [AuditModule],
  controllers: [SubscriptionsController, GooglePlayNotificationsController],
  providers: [SubscriptionsService, GooglePlayBillingService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

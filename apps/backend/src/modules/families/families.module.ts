import { Module } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../../common/mail/mail.module';
import { FamilyInvitationsController } from './family-invitations.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AuditModule, MailModule, SubscriptionsModule],
  providers: [FamiliesService],
  controllers: [FamiliesController, FamilyInvitationsController],
})
export class FamiliesModule {}

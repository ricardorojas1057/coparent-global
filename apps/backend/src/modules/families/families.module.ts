import { Module } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../../common/mail/mail.module';
import { FamilyInvitationsController } from './family-invitations.controller';

@Module({
  imports: [AuditModule, MailModule],
  providers: [FamiliesService],
  controllers: [FamiliesController, FamilyInvitationsController],
})
export class FamiliesModule {}

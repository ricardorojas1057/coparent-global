import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { FamiliesModule } from './modules/families/families.module';
import { ChildrenModule } from './modules/children/children.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { HealthController } from './health.controller';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AccountModule } from './modules/account/account.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    TenantsModule,
    FamiliesModule,
    ChildrenModule,
    CalendarModule,
    ExpensesModule,
    WhatsAppModule,
    MessagesModule,
    AccountModule,
    NotificationsModule,
  ],
})
export class AppModule {}

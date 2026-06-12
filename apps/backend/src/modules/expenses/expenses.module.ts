import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [AuditModule, SubscriptionsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}

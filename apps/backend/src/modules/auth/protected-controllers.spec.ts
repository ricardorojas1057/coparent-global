import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ChildrenController } from '../children/children.controller';
import { FamiliesController } from '../families/families.controller';
import { TenantsController } from '../tenants/tenants.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CalendarController } from '../calendar/calendar.controller';
import { ExpensesController } from '../expenses/expenses.controller';
import { MessagesController } from '../messages/messages.controller';
import { AccountController } from '../account/account.controller';

describe('protected controllers', () => {
  it.each([TenantsController, FamiliesController, ChildrenController, CalendarController, ExpensesController, MessagesController, AccountController])(
    'protects %p with JwtAuthGuard',
    (controller) => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, controller) ?? [];

      expect(guards).toContain(JwtAuthGuard);
    },
  );
});

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttachExpenseReceiptDto, CreateExpenseDto, UpdateExpenseAllocationStatusDto } from './expenses.dto';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.expenses.findMine(user.id);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.expenses.create(dto, user.id);
  }

  @Get('summary')
  summary(@Query('familyId') familyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expenses.summary(familyId, user.id);
  }

  @Get('report')
  report(
    @Query('familyId') familyId: string,
    @Query('month') month: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expenses.monthlyReport(familyId, month, user.id);
  }

  @Patch('allocations/:id/pay')
  markAllocationPaid(@Param('id') allocationId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.expenses.markAllocationPaid(allocationId, user.id);
  }

  @Patch('allocations/:id/status')
  updateAllocationStatus(
    @Param('id') allocationId: string,
    @Body() dto: UpdateExpenseAllocationStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expenses.updateAllocationStatus(allocationId, dto.status, user.id);
  }

  @Patch(':id/receipt')
  attachReceipt(
    @Param('id') expenseId: string,
    @Body() dto: AttachExpenseReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.expenses.attachReceipt(expenseId, dto, user.id);
  }
}

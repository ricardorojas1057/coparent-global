import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateExpenseDto, ExpenseSplitMode } from './expenses.dto';
import { AttachExpenseReceiptDto } from './expenses.dto';

const expenseInclude = {
  payer: { select: { id: true, firstName: true, lastName: true, email: true } },
  allocations: {
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: { user: { firstName: 'asc' as const } },
  },
};

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  findMine(userId: string) {
    return this.prisma.expense.findMany({
      where: { family: { members: { some: { userId } } } },
      include: expenseInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateExpenseDto, userId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: dto.familyId },
      include: { members: true },
    });
    if (!family || !family.members.some((member) => member.userId === userId)) {
      throw new ForbiddenException('No tenes permisos para registrar gastos en esta familia.');
    }
    if (!family.members.some((member) => member.userId === dto.paidById)) {
      throw new BadRequestException('Quien pago debe integrar la familia.');
    }

    const amount = new Prisma.Decimal(dto.amount);
    const splitMode = dto.splitMode ?? ExpenseSplitMode.SHARED;
    const allocationCreates =
      splitMode === ExpenseSplitMode.SINGLE_PAYER
        ? [
            {
              userId: dto.paidById,
              percentage: new Prisma.Decimal(100),
              amountDue: amount,
              status: ExpenseStatus.PAID,
            },
          ]
        : (() => {
            const memberCount = family.members.length;
            const baseCents = Math.floor(Math.round(dto.amount * 100) / memberCount);
            const remainder = Math.round(dto.amount * 100) - baseCents * memberCount;

            return family.members.map((member, index) => {
              const cents = baseCents + (index < remainder ? 1 : 0);
              return {
                userId: member.userId,
                percentage: new Prisma.Decimal((100 / memberCount).toFixed(2)),
                amountDue: new Prisma.Decimal((cents / 100).toFixed(2)),
                status: member.userId === dto.paidById ? ExpenseStatus.PAID : ExpenseStatus.PENDING,
              };
            });
          })();

    const expense = await this.prisma.expense.create({
      data: {
        familyId: dto.familyId,
        paidById: dto.paidById,
        description: dto.description,
        category: dto.category,
        amount,
        storageProvider: dto.receiptReference ? 'REFERENCE' : 'LOCAL',
        storageKey: dto.receiptReference,
        mimeType: dto.receiptMimeType,
        fileSize: dto.receiptFileSize,
        allocations: {
          create: allocationCreates,
        },
      },
      include: expenseInclude,
    });
    await this.audit.log({
      userId,
      familyId: dto.familyId,
      action: 'CREATE_EXPENSE',
      entity: 'Expense',
      entityId: expense.id,
      metadata: { description: dto.description, amount: dto.amount, category: dto.category, splitMode },
    });
    await this.notifications?.notifyFamily({
      familyId: dto.familyId,
      actorId: userId,
      title: 'Nuevo gasto familiar',
      body: dto.description,
      data: { type: 'expense', expenseId: expense.id },
    });
    return expense;
  }

  async markAllocationPaid(allocationId: string, userId: string) {
    return this.updateAllocationStatus(allocationId, ExpenseStatus.PAID, userId);
  }

  async updateAllocationStatus(allocationId: string, status: ExpenseStatus, userId: string) {
    const allowedStatuses = new Set<ExpenseStatus>([ExpenseStatus.PAID, ExpenseStatus.OBSERVED, ExpenseStatus.REJECTED]);
    if (!allowedStatuses.has(status)) {
      throw new BadRequestException('El estado solicitado no esta permitido.');
    }
    const allocation = await this.prisma.expenseAllocation.findUnique({
      where: { id: allocationId },
      include: { expense: true },
    });
    if (!allocation) {
      throw new NotFoundException('No encontramos la parte del gasto.');
    }
    if (allocation.userId !== userId) {
      throw new ForbiddenException('Solo podes marcar como pagada tu propia parte.');
    }

    const updated = await this.prisma.expenseAllocation.update({
      where: { id: allocationId },
      data: { status },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    await this.audit.log({
      userId,
      familyId: allocation.expense.familyId,
      action: status === ExpenseStatus.PAID ? 'PAY_EXPENSE_ALLOCATION' : 'UPDATE_EXPENSE_ALLOCATION',
      entity: 'ExpenseAllocation',
      entityId: allocationId,
      metadata: { expenseId: allocation.expenseId },
    });
    return updated;
  }

  async attachReceipt(expenseId: string, dto: AttachExpenseReceiptDto, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { family: { include: { members: true } } },
    });
    if (!expense) throw new NotFoundException('No encontramos el gasto.');
    if (!expense.family.members.some((member) => member.userId === userId)) {
      throw new ForbiddenException('No integras esta familia.');
    }
    if (expense.paidById !== userId) {
      throw new ForbiddenException('Solo quien registro el pago puede adjuntar el comprobante.');
    }
    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        storageProvider: 'REFERENCE',
        storageKey: dto.receiptReference,
        mimeType: dto.receiptMimeType,
        fileSize: dto.receiptFileSize,
      },
      include: expenseInclude,
    });
    await this.audit.log({
      userId,
      familyId: expense.familyId,
      action: 'ATTACH_EXPENSE_RECEIPT',
      entity: 'Expense',
      entityId: expenseId,
    });
    return updated;
  }

  async summary(familyId: string, userId: string) {
    const family = await this.prisma.family.findFirst({
      where: { id: familyId, members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        settings: true,
        expenses: { include: { allocations: true } },
      },
    });
    if (!family) throw new ForbiddenException('No integras esta familia.');

    const balances = family.members.map((member) => {
      let paid = 0;
      let owes = 0;
      let receivable = 0;
      for (const expense of family.expenses) {
        if (expense.paidById === member.userId) paid += Number(expense.amount);
        for (const allocation of expense.allocations) {
          if (allocation.userId === expense.paidById || allocation.status === ExpenseStatus.PAID) continue;
          const amount = Number(allocation.amountDue);
          if (allocation.userId === member.userId) owes += amount;
          if (expense.paidById === member.userId) receivable += amount;
        }
      }
      return {
        user: member.user,
        paid: Number(paid.toFixed(2)),
        owes: Number(owes.toFixed(2)),
        receivable: Number(receivable.toFixed(2)),
        net: Number((receivable - owes).toFixed(2)),
      };
    });
    return {
      familyId,
      currency: family.settings?.currency ?? 'ARS',
      totalOutstanding: Number(balances.reduce((total, balance) => total + balance.owes, 0).toFixed(2)),
      balances,
    };
  }

  async monthlyReport(familyId: string, month: string, userId: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
      throw new BadRequestException('El mes debe tener formato AAAA-MM.');
    }
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const start = new Date(Date.UTC(year, monthIndex, 1));
    const end = new Date(Date.UTC(year, monthIndex + 1, 1));
    const previousStart = new Date(Date.UTC(year, monthIndex - 1, 1));

    const family = await this.prisma.family.findFirst({
      where: { id: familyId, members: { some: { userId } } },
      include: {
        settings: true,
        expenses: {
          where: { createdAt: { gte: previousStart, lt: end } },
          include: {
            payer: { select: { id: true, firstName: true, lastName: true } },
            allocations: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!family) throw new ForbiddenException('No integras esta familia.');

    const currentExpenses = family.expenses.filter((expense) => expense.createdAt >= start);
    const previousExpenses = family.expenses.filter((expense) => expense.createdAt < start);
    const total = currentExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const previousMonthTotal = previousExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const sharedTotal = currentExpenses
      .filter((expense) => expense.allocations.length > 1)
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    const individualTotal = total - sharedTotal;
    const outstandingTotal = currentExpenses.reduce(
      (sum, expense) =>
        sum +
        expense.allocations
          .filter((allocation) => allocation.userId !== expense.paidById && allocation.status !== ExpenseStatus.PAID)
          .reduce((allocationSum, allocation) => allocationSum + Number(allocation.amountDue), 0),
      0,
    );

    const categoryTotals = new Map<string, number>();
    const payerTotals = new Map<string, { user: { id: string; firstName: string; lastName: string }; total: number }>();
    for (const expense of currentExpenses) {
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + Number(expense.amount));
      const payer = payerTotals.get(expense.paidById) ?? { user: expense.payer, total: 0 };
      payer.total += Number(expense.amount);
      payerTotals.set(expense.paidById, payer);
    }

    return {
      familyId,
      month,
      currency: family.settings?.currency ?? 'ARS',
      total: Number(total.toFixed(2)),
      previousMonthTotal: Number(previousMonthTotal.toFixed(2)),
      changePercentage:
        previousMonthTotal > 0 ? Number((((total - previousMonthTotal) / previousMonthTotal) * 100).toFixed(1)) : null,
      sharedTotal: Number(sharedTotal.toFixed(2)),
      individualTotal: Number(individualTotal.toFixed(2)),
      outstandingTotal: Number(outstandingTotal.toFixed(2)),
      byCategory: Array.from(categoryTotals.entries())
        .map(([category, categoryTotal]) => ({
          category,
          total: Number(categoryTotal.toFixed(2)),
          percentage: total > 0 ? Number(((categoryTotal / total) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.total - a.total),
      byPayer: Array.from(payerTotals.values())
        .map((payer) => ({ ...payer, total: Number(payer.total.toFixed(2)) }))
        .sort((a, b) => b.total - a.total),
    };
  }
}

import { ExpenseStatus } from '@prisma/client';
import { ExpenseSplitMode } from './expenses.dto';
import { ExpensesService } from './expenses.service';

describe('ExpensesService create', () => {
  it('registers a single-payer expense without pending reimbursements', async () => {
    const prisma = {
      family: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'family-id',
          members: [{ userId: 'payer' }, { userId: 'other' }],
        }),
      },
      expense: {
        create: jest.fn().mockResolvedValue({ id: 'expense-id' }),
      },
    };
    const audit = { log: jest.fn() };
    const service = new ExpensesService(prisma as never, audit as never);

    await service.create(
      {
        familyId: 'family-id',
        paidById: 'payer',
        description: 'Uniforme',
        category: 'SCHOOL',
        amount: 120.5,
        splitMode: ExpenseSplitMode.SINGLE_PAYER,
      },
      'payer',
    );

    const createArg = prisma.expense.create.mock.calls[0][0];
    expect(createArg.data.allocations.create).toHaveLength(1);
    expect(createArg.data.allocations.create[0]).toMatchObject({
      userId: 'payer',
      status: ExpenseStatus.PAID,
    });
    expect(createArg.data.allocations.create[0].percentage.toString()).toBe('100');
    expect(createArg.data.allocations.create[0].amountDue.toString()).toBe('120.5');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({ splitMode: ExpenseSplitMode.SINGLE_PAYER }),
    }));
  });
});

describe('ExpensesService summary', () => {
  it('calculates outstanding balances without counting paid allocations', async () => {
    const prisma = {
      family: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'family-id',
          settings: { currency: 'USD' },
          members: [
            { userId: 'payer', user: { id: 'payer', firstName: 'Alex', lastName: 'A' } },
            { userId: 'other', user: { id: 'other', firstName: 'Sam', lastName: 'B' } },
          ],
          expenses: [
            {
              paidById: 'payer',
              amount: 100,
              allocations: [
                { userId: 'payer', amountDue: 50, status: ExpenseStatus.PAID },
                { userId: 'other', amountDue: 50, status: ExpenseStatus.PENDING },
              ],
            },
          ],
        }),
      },
    };
    const service = new ExpensesService(prisma as never, { log: jest.fn() } as never);

    await expect(service.summary('family-id', 'payer')).resolves.toMatchObject({
      currency: 'USD',
      totalOutstanding: 50,
      balances: [
        { user: { id: 'payer' }, receivable: 50, net: 50 },
        { user: { id: 'other' }, owes: 50, net: -50 },
      ],
    });
  });
});

describe('ExpensesService monthly report', () => {
  it('groups monthly totals and compares with the previous month', async () => {
    const prisma = {
      family: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'family-id',
          settings: { currency: 'ARS' },
          expenses: [
            {
              paidById: 'payer',
              payer: { id: 'payer', firstName: 'Alex', lastName: 'A' },
              category: 'SCHOOL',
              amount: 100,
              createdAt: new Date('2026-05-20T12:00:00Z'),
              allocations: [{ userId: 'payer', amountDue: 100, status: ExpenseStatus.PAID }],
            },
            {
              paidById: 'payer',
              payer: { id: 'payer', firstName: 'Alex', lastName: 'A' },
              category: 'SCHOOL',
              amount: 200,
              createdAt: new Date('2026-06-05T12:00:00Z'),
              allocations: [
                { userId: 'payer', amountDue: 100, status: ExpenseStatus.PAID },
                { userId: 'other', amountDue: 100, status: ExpenseStatus.PENDING },
              ],
            },
            {
              paidById: 'other',
              payer: { id: 'other', firstName: 'Sam', lastName: 'B' },
              category: 'HEALTH',
              amount: 50,
              createdAt: new Date('2026-06-10T12:00:00Z'),
              allocations: [{ userId: 'other', amountDue: 50, status: ExpenseStatus.PAID }],
            },
          ],
        }),
      },
    };
    const service = new ExpensesService(prisma as never, { log: jest.fn() } as never);

    await expect(service.monthlyReport('family-id', '2026-06', 'payer')).resolves.toMatchObject({
      total: 250,
      previousMonthTotal: 100,
      changePercentage: 150,
      sharedTotal: 200,
      individualTotal: 50,
      outstandingTotal: 100,
      byCategory: [
        { category: 'SCHOOL', total: 200, percentage: 80 },
        { category: 'HEALTH', total: 50, percentage: 20 },
      ],
    });
  });
});

describe('ExpensesService private receipts', () => {
  it('stores a private receipt with a content hash', async () => {
    const receipt = {
      id: 'receipt-id',
      fileName: 'ticket.png',
      mimeType: 'image/png',
      fileSize: 4,
      sha256: 'placeholder',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const prisma = {
      expense: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'expense-id',
          familyId: 'family-id',
          paidById: 'payer',
          family: { members: [{ userId: 'payer' }] },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      expenseReceipt: {
        upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ ...receipt, sha256: create.sha256 })),
      },
    };
    const audit = { log: jest.fn() };
    const subscriptions = { assertEntitlement: jest.fn() };
    const service = new ExpensesService(prisma as never, audit as never, undefined, subscriptions as never);

    const uploaded = await service.uploadReceiptFile(
      'expense-id',
      { dataBase64: Buffer.from('test').toString('base64'), mimeType: 'image/png', fileName: 'ticket.png' },
      'payer',
    );

    expect(uploaded.sha256).toHaveLength(64);
    expect(prisma.expenseReceipt.upsert).toHaveBeenCalled();
    expect(subscriptions.assertEntitlement).toHaveBeenCalledWith('family-id', 'payer', 'receiptManagement');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPLOAD_PRIVATE_EXPENSE_RECEIPT' }));
  });
});

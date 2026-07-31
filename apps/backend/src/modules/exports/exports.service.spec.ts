import { ForbiddenException } from '@nestjs/common';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';
import { ExportsService } from './exports.service';

describe('ExportsService', () => {
  const baseFamily = {
    id: 'family-id',
    tenant: { name: 'Familia Demo' },
    settings: { currency: 'ARS' },
    members: [
      {
        id: 'member-1',
        familyId: 'family-id',
        userId: 'user-1',
        role: 'PRIMARY_PARENT',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        user: { id: 'user-1', email: 'uno@example.com', firstName: 'Ana', lastName: 'Demo' },
      },
      {
        id: 'member-2',
        familyId: 'family-id',
        userId: 'user-2',
        role: 'SECONDARY_PARENT',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        user: { id: 'user-2', email: 'dos@example.com', firstName: 'Luis', lastName: 'Demo' },
      },
    ],
    children: [
      {
        id: 'child-1',
        familyId: 'family-id',
        firstName: 'Mateo',
        lastName: 'Demo',
        birthDate: new Date('2020-01-01T00:00:00.000Z'),
        observations: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        calendarEvents: [
          {
            id: 'event-1',
            scheduleId: null,
            childId: 'child-1',
            currentParentId: 'user-1',
            createdById: 'user-1',
            title: 'Consulta pediatrica',
            type: 'HEALTH',
            location: null,
            notes: null,
            startDate: new Date('2026-02-01T10:00:00.000Z'),
            endDate: new Date('2026-02-01T11:00:00.000Z'),
            isOverride: false,
            status: 'SCHEDULED',
            createdAt: new Date('2026-01-10T00:00:00.000Z'),
            updatedAt: new Date('2026-01-10T00:00:00.000Z'),
            currentParent: { id: 'user-1', firstName: 'Ana', lastName: 'Demo' },
          },
        ],
      },
    ],
    expenses: [
      {
        id: 'expense-1',
        familyId: 'family-id',
        paidById: 'user-1',
        description: 'Cuota escolar',
        category: ExpenseCategory.SCHOOL,
        amount: 100,
        createdAt: new Date('2026-02-02T12:00:00.000Z'),
        storageProvider: 'LOCAL',
        storageKey: null,
        mimeType: null,
        fileSize: null,
        ocrMetadata: null,
        payer: { id: 'user-1', firstName: 'Ana', lastName: 'Demo' },
        allocations: [
          {
            id: 'allocation-1',
            expenseId: 'expense-1',
            userId: 'user-1',
            percentage: 50,
            amountDue: 50,
            status: ExpenseStatus.PAID,
            updatedAt: new Date('2026-02-02T12:00:00.000Z'),
            sourceRuleId: null,
            user: { id: 'user-1', firstName: 'Ana', lastName: 'Demo' },
          },
          {
            id: 'allocation-2',
            expenseId: 'expense-1',
            userId: 'user-2',
            percentage: 50,
            amountDue: 50,
            status: ExpenseStatus.PENDING,
            updatedAt: new Date('2026-02-02T12:00:00.000Z'),
            sourceRuleId: null,
            user: { id: 'user-2', firstName: 'Luis', lastName: 'Demo' },
          },
        ],
      },
    ],
    chatMessages: [
      {
        id: 'message-1',
        familyId: 'family-id',
        senderId: 'user-1',
        content: 'Recordemos llevar el carnet medico.',
        originalContent: null,
        aiSuggestion: null,
        aiIntervened: false,
        category: 'HEALTH',
        legalStatus: 'NORMAL',
        createdAt: new Date('2026-02-03T10:00:00.000Z'),
        editedAt: null,
        isDeleted: false,
        clientMutationId: null,
        sender: { id: 'user-1', firstName: 'Ana', lastName: 'Demo' },
      },
    ],
  };

  it('generates a basic HTML family export with calendar, expenses, balances and messages', async () => {
    const prisma = {
      family: {
        findFirst: jest.fn().mockResolvedValue(baseFamily),
      },
    };
    const audit = { log: jest.fn().mockResolvedValue({}) };
    const service = new ExportsService(prisma as never, audit as never);

    const result = await service.basicFamilyHtml('family-id', 'user-1', 'es');

    expect(result.mimeType).toBe('text/html');
    expect(result.fileName).toMatch(/coparent-global-familia-demo-/);
    expect(result.manifest.digest).toHaveLength(64);
    expect(result.html).toContain('Consulta pediatrica');
    expect(result.html).toContain('Cuota escolar');
    expect(result.html).toContain('Recordemos llevar el carnet medico.');
    expect(result.html).toContain('No constituye una constancia legal universal');
    expect(result.text).toContain('Saldos');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'EXPORT_BASIC_FAMILY_HTML' }));
  });

  it('does not export data when the user is not a family member', async () => {
    const prisma = {
      family: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const audit = { log: jest.fn() };
    const service = new ExportsService(prisma as never, audit as never);

    await expect(service.basicFamilyHtml('family-id', 'stranger-id', 'es')).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.log).not.toHaveBeenCalled();
  });
});


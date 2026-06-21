import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('uses an execute-only advisory lock before appending to the audit chain', async () => {
    const transaction = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      auditLog: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'audit-id', ...data })),
      },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation((callback) => callback(transaction)),
    };
    const service = new AuditService(prisma as never);

    const result = await service.log({
      userId: 'user-id',
      familyId: 'family-id',
      action: 'TEST_ACTION',
      entity: 'Test',
      entityId: 'entity-id',
    });

    expect(transaction.$executeRaw).toHaveBeenCalled();
    expect(result.recordHash).toHaveLength(64);
    expect(transaction.auditLog.create).toHaveBeenCalled();
  });
});

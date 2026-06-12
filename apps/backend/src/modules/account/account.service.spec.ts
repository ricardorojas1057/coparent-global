import { AccountDeletionStatus } from '@prisma/client';
import { AccountService } from './account.service';

describe('AccountService deletion requests', () => {
  it('keeps deletion requests idempotent', async () => {
    const existing = { id: 'request-id', userId: 'user-id', status: AccountDeletionStatus.PENDING };
    const prisma = {
      accountDeletionRequest: {
        findFirst: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
      },
    };
    const service = new AccountService(prisma as never, { log: jest.fn() } as never);

    await expect(service.requestDeletion('user-id')).resolves.toBe(existing);
    expect(prisma.accountDeletionRequest.create).not.toHaveBeenCalled();
  });

  it('anonymizes personal data and revokes access when deletion is confirmed', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      accountDeletionRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'request-id',
          userId: 'user-id',
          status: AccountDeletionStatus.PENDING,
        }),
        update,
      },
      devicePushToken: { deleteMany },
      notification: { deleteMany },
      passwordResetToken: { deleteMany },
      emailVerificationToken: { deleteMany },
      whatsAppLink: { deleteMany },
      userPrivacySettings: { deleteMany },
      familyMember: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        update: jest.fn(),
        deleteMany,
      },
      tenantUser: { deleteMany },
      user: { update },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const audit = { log: jest.fn().mockResolvedValue({}) };
    const service = new AccountService(prisma as never, audit as never);

    await expect(service.completeDeletion('user-id', true)).resolves.toEqual({ deleted: true });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'COMPLETE_ACCOUNT_DELETION' }));
  });
});

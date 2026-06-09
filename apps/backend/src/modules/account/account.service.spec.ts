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
});

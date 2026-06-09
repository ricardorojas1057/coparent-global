import { AuthService } from './auth.service';

describe('AuthService password recovery', () => {
  const jwt = { sign: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('production') };
  const mail = { sendPasswordReset: jest.fn().mockResolvedValue({ delivered: true }) };

  beforeEach(() => jest.clearAllMocks());

  it('does not reveal whether an email exists', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = new AuthService(prisma as never, jwt as never, config as never, mail as never);

    const result = await service.requestPasswordReset({ email: 'unknown@example.com' });

    expect(result.message).toContain('Si existe una cuenta');
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('stores only a token hash and sends the raw token', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-id', email: 'person@example.com' }) },
      passwordResetToken: { create: jest.fn().mockResolvedValue({ id: 'reset-id' }) },
    };
    const service = new AuthService(prisma as never, jwt as never, config as never, mail as never);

    await service.requestPasswordReset({ email: 'PERSON@example.com' });

    const storedHash = prisma.passwordResetToken.create.mock.calls[0][0].data.tokenHash;
    const sentToken = mail.sendPasswordReset.mock.calls[0][1];
    expect(storedHash).toHaveLength(64);
    expect(storedHash).not.toBe(sentToken);
  });
});

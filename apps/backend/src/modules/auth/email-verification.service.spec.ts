import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService email verification', () => {
  const jwt = { sign: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('production') };
  const mail = { sendEmailVerification: jest.fn().mockResolvedValue({ delivered: true }) };

  beforeEach(() => jest.clearAllMocks());

  it('does not reveal whether an email needs verification', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = new AuthService(prisma as never, jwt as never, config as never, mail as never);

    const result = await service.requestEmailVerification({ email: 'unknown@example.com' });

    expect(result.message).toContain('Si la cuenta necesita');
    expect(mail.sendEmailVerification).not.toHaveBeenCalled();
  });

  it('verifies a valid one-time token and invalidates the remaining tokens', async () => {
    const verification = {
      userId: 'user-id',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const prisma = {
      emailVerificationToken: {
        findUnique: jest.fn().mockResolvedValue(verification),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const service = new AuthService(prisma as never, jwt as never, config as never, mail as never);

    await expect(service.confirmEmailVerification({ token: 'valid-token' })).resolves.toEqual({
      message: 'Email verificado. Ya podes ingresar a Coparent Global.',
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects expired verification links', async () => {
    const prisma = {
      emailVerificationToken: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-id',
          usedAt: null,
          expiresAt: new Date(Date.now() - 1),
        }),
      },
    };
    const service = new AuthService(prisma as never, jwt as never, config as never, mail as never);

    await expect(service.confirmEmailVerification({ token: 'expired-token' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

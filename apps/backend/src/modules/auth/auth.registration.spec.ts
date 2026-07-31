import { AuthService } from './auth.service';

describe('AuthService registration', () => {
  const dto = {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    password: 'password123',
  };

  it('creates a verified MVP account when email delivery is not configured', async () => {
    const user = {
      id: 'user-id',
      email: dto.email,
      role: 'PARENT',
      authVersion: 0,
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(user),
      },
    };
    const jwt = { sign: jest.fn().mockReturnValue('access-token') };
    const config = { get: jest.fn() };
    const mail = {
      isConfigured: jest.fn().mockReturnValue(false),
      sendEmailVerification: jest.fn(),
    };
    const service = new AuthService(prisma as never, jwt as never, config as never, mail as never);

    await expect(service.register(dto)).resolves.toEqual({
      accessToken: 'access-token',
      userId: user.id,
      email: user.email,
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: dto.email,
        emailVerifiedAt: expect.any(Date),
      }),
    });
    expect(mail.sendEmailVerification).not.toHaveBeenCalled();
  });
});

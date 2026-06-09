import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService Google login', () => {
  const jwt = { sign: jest.fn().mockReturnValue('jwt-token') };
  const config = { get: jest.fn() };
  const mail = { sendPasswordReset: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('rejects Google tokens without a verified email', async () => {
    const service = new AuthService({} as never, jwt as never, config as never, mail as never);
    (service as unknown as { verifyGoogleIdToken: jest.Mock }).verifyGoogleIdToken = jest.fn().mockResolvedValue({
      sub: 'google-sub',
      email: 'person@example.com',
      email_verified: false,
    });

    await expect(service.googleLogin({ idToken: 'id-token' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates an app session for a verified Google user', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: 'person@example.com',
          role: 'PARENT',
          authVersion: 0,
        }),
      },
    };
    const service = new AuthService(prisma as never, jwt as never, config as never, mail as never);
    (service as unknown as { verifyGoogleIdToken: jest.Mock }).verifyGoogleIdToken = jest.fn().mockResolvedValue({
      sub: 'google-sub',
      email: 'Person@Example.com',
      email_verified: true,
      name: 'Persona Demo',
    });

    const result = await service.googleLogin({ idToken: 'id-token' });

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: 'person@example.com', googleSubject: 'google-sub' }),
    }));
    expect(result.accessToken).toBe('jwt-token');
  });
});

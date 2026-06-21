import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService Google login', () => {
  const jwt = { sign: jest.fn().mockReturnValue('jwt-token') };
  const config = { get: jest.fn() };
  const mail = { sendPasswordReset: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('builds the browser fallback Google OAuth URL', () => {
    config.get.mockImplementation((key: string) => ({
      GOOGLE_WEB_CLIENT_ID: 'web-client.apps.googleusercontent.com',
      GOOGLE_WEB_CLIENT_SECRET: 'secret',
      PUBLIC_API_URL: 'https://api.example.test',
    })[key]);
    const service = new AuthService({} as never, jwt as never, config as never, mail as never);

    const url = new URL(service.googleMobileStartUrl());

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe('web-client.apps.googleusercontent.com');
    expect(url.searchParams.get('redirect_uri')).toBe('https://api.example.test/auth/google/mobile/callback');
    expect(url.searchParams.get('state')).toBe('jwt-token');
  });

  it('returns a mobile error deep link when browser fallback is not configured', () => {
    config.get.mockReturnValue(undefined);
    const service = new AuthService({} as never, jwt as never, config as never, mail as never);

    expect(service.googleMobileStartUrl()).toContain('coparentglobal://auth/google?error=');
  });

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

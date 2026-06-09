import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  } as unknown as AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the authenticated user from me', () => {
    const controller = new AuthController(authService);
    const user: AuthenticatedUser = {
      id: 'user-id',
      email: 'demo@coparent.ar',
      role: 'PARENT',
      firstName: 'Demo',
      lastName: 'Coparent',
    };

    expect(controller.me(user)).toEqual(user);
  });
});

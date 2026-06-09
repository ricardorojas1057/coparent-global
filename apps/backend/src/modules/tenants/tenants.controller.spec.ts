import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { AuthenticatedUser } from '../auth/auth.types';

describe('TenantsController', () => {
  const tenantsService = {
    findMine: jest.fn(),
    create: jest.fn(),
  } as unknown as TenantsService;

  const user: AuthenticatedUser = {
    id: 'user-id',
    email: 'demo@coparent.ar',
    role: 'PARENT',
    firstName: 'Demo',
    lastName: 'Coparent',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists tenants for the current user', () => {
    const controller = new TenantsController(tenantsService);

    controller.findMine(user);

    expect(tenantsService.findMine).toHaveBeenCalledWith(user.id);
  });
});

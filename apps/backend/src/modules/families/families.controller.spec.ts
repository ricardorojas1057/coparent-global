import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { AuthenticatedUser } from '../auth/auth.types';

describe('FamiliesController', () => {
  const familiesService = {
    findMine: jest.fn(),
    create: jest.fn(),
  } as unknown as FamiliesService;

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

  it('lists families for the current user', () => {
    const controller = new FamiliesController(familiesService);

    controller.findMine(user);

    expect(familiesService.findMine).toHaveBeenCalledWith(user.id);
  });
});

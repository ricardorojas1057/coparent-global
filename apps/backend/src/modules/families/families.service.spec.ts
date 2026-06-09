import { ForbiddenException } from '@nestjs/common';
import { FamilyRole } from '@prisma/client';
import { FamiliesService } from './families.service';

describe('FamiliesService settings permissions', () => {
  it('prevents a secondary parent from changing the relationship mode', async () => {
    const prisma = {
      familyMember: {
        findUnique: jest.fn().mockResolvedValue({ familyId: 'family-id', userId: 'user-id', role: FamilyRole.SECONDARY_PARENT }),
      },
      familySettings: { upsert: jest.fn() },
    };
    const service = new FamiliesService(
      prisma as never,
      { log: jest.fn() } as never,
      { publicWebUrl: jest.fn(), sendFamilyInvitation: jest.fn() } as never,
    );

    await expect(service.updateSettings('family-id', { relationshipMode: 'HIGH_CONFLICT' }, 'user-id')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.familySettings.upsert).not.toHaveBeenCalled();
  });
});

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

  it('exports a family archive with a SHA-256 integrity manifest', async () => {
    const prisma = {
      family: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'family-id',
          tenant: { name: 'Familia Demo', type: 'B2C_DIRECT' },
          settings: {},
          members: [],
          children: [],
          expenses: [],
          chatMessages: [],
          auditLogs: [],
        }),
      },
    };
    const audit = { log: jest.fn().mockResolvedValue({}) };
    const subscriptions = { assertEntitlement: jest.fn().mockResolvedValue(undefined) };
    const service = new FamiliesService(
      prisma as never,
      audit as never,
      { publicWebUrl: jest.fn(), sendFamilyInvitation: jest.fn() } as never,
      subscriptions as never,
    );

    const archive = await service.exportArchive('family-id', 'user-id');

    expect(archive.manifest.algorithm).toBe('SHA-256');
    expect(archive.manifest.digest).toHaveLength(64);
    expect(subscriptions.assertEntitlement).toHaveBeenCalledWith('family-id', 'user-id', 'verifiedAuditExports');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'EXPORT_FAMILY_ARCHIVE' }));
  });
});

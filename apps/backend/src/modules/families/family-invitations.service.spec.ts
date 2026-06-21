import { ForbiddenException } from '@nestjs/common';
import { FamilyInvitationGuestResponse, FamilyRole } from '@prisma/client';
import { FamiliesService } from './families.service';

describe('FamiliesService invitations', () => {
  it('creates a shareable invitation without storing the raw token', async () => {
    const prisma = {
      familyMember: { findUnique: jest.fn().mockResolvedValue({ role: FamilyRole.PRIMARY_PARENT }) },
      familyInvitation: {
        create: jest.fn().mockResolvedValue({
          id: 'invite-id',
          email: 'person@example.com',
          role: FamilyRole.SECONDARY_PARENT,
          status: 'PENDING',
          expiresAt: new Date('2026-06-14T12:00:00Z'),
          family: { tenant: { name: 'Familia Demo' } },
        }),
        updateMany: jest.fn(),
      },
    };
    const mail = {
      publicWebUrl: jest.fn().mockReturnValue('https://coparent.example'),
      sendFamilyInvitation: jest.fn().mockResolvedValue({ delivered: false }),
    };
    const service = new FamiliesService(prisma as never, { log: jest.fn() } as never, mail as never);

    const result = await service.createInvitation('family-id', { email: 'PERSON@example.com' }, 'user-id');

    const storedHash = prisma.familyInvitation.create.mock.calls[0][0].data.tokenHash;
    expect(storedHash).toHaveLength(64);
    expect(result.shareUrl).toContain('https://coparent.example/invite?token=');
    expect(result.shareUrl).not.toContain(storedHash);
  });

  it('prevents a different email from accepting a restricted invitation', async () => {
    const prisma = {
      familyInvitation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'invite-id',
          familyId: 'family-id',
          email: 'invited@example.com',
          role: FamilyRole.SECONDARY_PARENT,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 60_000),
          family: { tenant: { name: 'Familia Demo' } },
          invitedBy: { firstName: 'Demo', lastName: 'Parent' },
        }),
      },
    };
    const service = new FamiliesService(
      prisma as never,
      { log: jest.fn() } as never,
      { publicWebUrl: jest.fn(), sendFamilyInvitation: jest.fn() } as never,
    );

    await expect(service.acceptInvitation('raw-token', 'user-id', 'other@example.com')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('records a guest response without creating a family membership', async () => {
    const prisma = {
      familyInvitation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'invite-id',
          familyId: 'family-id',
          email: null,
          role: FamilyRole.SECONDARY_PARENT,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 60_000),
          family: { tenant: { name: 'Familia Demo' } },
          invitedBy: { firstName: 'Demo', lastName: 'Parent' },
        }),
        update: jest.fn().mockResolvedValue({
          guestResponse: FamilyInvitationGuestResponse.INTERESTED,
          guestRespondedAt: new Date(),
        }),
      },
    };
    const service = new FamiliesService(
      prisma as never,
      { log: jest.fn() } as never,
      { publicWebUrl: jest.fn(), sendFamilyInvitation: jest.fn() } as never,
    );

    const result = await service.respondToInvitation('raw-token', FamilyInvitationGuestResponse.INTERESTED);

    expect(result.guestResponse).toBe(FamilyInvitationGuestResponse.INTERESTED);
    expect(prisma.familyInvitation.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'invite-id' } }),
    );
  });
});

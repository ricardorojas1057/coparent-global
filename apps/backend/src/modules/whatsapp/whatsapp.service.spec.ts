import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { WhatsAppActionStatus, WhatsAppActionType } from '@prisma/client';
import { WhatsAppService } from './whatsapp.service';

function createService(overrides: Record<string, unknown> = {}) {
  const prisma = {
    familyMember: { findUnique: jest.fn().mockResolvedValue({ familyId: 'family-id', userId: 'user-id' }) },
    whatsAppLink: { upsert: jest.fn().mockResolvedValue({ id: 'link-id', familyId: 'family-id', userId: 'user-id' }) },
    family: { findUnique: jest.fn().mockResolvedValue({ id: 'family-id', children: [] }) },
    whatsAppPendingAction: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({
        id: 'action-id',
        ...data,
        link: { familyId: 'family-id', family: { tenant: { name: 'Familia' } } },
      })),
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'action-id', ...data })),
    },
    ...overrides,
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const messages = {
    create: jest.fn().mockResolvedValue({
      message: { id: 'message-id' },
      review: { needsReview: true, reasons: ['Lenguaje agresivo'], suggestion: 'Version neutral.' },
    }),
  };
  const service = new WhatsAppService(
    prisma as never,
    { get: jest.fn() } as never,
    audit as never,
    {} as never,
    {} as never,
    messages as never,
  );
  return { service, prisma, audit, messages };
}

describe('WhatsAppService shared drafts', () => {
  it('creates a link instruction with app URL and manual confirmation context', async () => {
    const { service } = createService();

    const result = await service.createLinkCode('family-id', 'user-id');

    expect(result.instruction).toContain('https://coparent-global.vercel.app');
    expect(result.instruction).toContain(`VINCULAR ${result.code}`);
    expect(result.instruction).toContain('pendiente');
  });

  it('creates a pending device-share draft without applying it to the family', async () => {
    const { service, prisma, audit } = createService();

    const result = await service.createSharedAction({
      familyId: 'family-id',
      text: 'Gaste $35000 en utiles escolares',
    }, 'user-id');

    expect(result.type).toBe(WhatsAppActionType.EXPENSE);
    expect(prisma.whatsAppPendingAction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        linkId: 'link-id',
        type: WhatsAppActionType.EXPENSE,
        payload: expect.objectContaining({ source: 'DEVICE_SHARE' }),
      }),
    }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE_DEVICE_SHARE_DRAFT' }));
  });

  it('rejects an empty shared draft', async () => {
    const { service, prisma } = createService();

    await expect(service.createSharedAction({ familyId: 'family-id' }, 'user-id'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.whatsAppPendingAction.create).not.toHaveBeenCalled();
  });

  it('does not edit an action that is no longer pending', async () => {
    const { service, prisma } = createService();
    prisma.whatsAppPendingAction.findUnique.mockResolvedValue({
      id: 'action-id',
      status: WhatsAppActionStatus.CONFIRMED,
      link: { id: 'link-id', familyId: 'family-id', userId: 'user-id' },
    });

    await expect(service.updateAction('action-id', 'Nuevo texto', 'user-id'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects access after the user is removed from the family', async () => {
    const { service, prisma } = createService();
    prisma.familyMember.findUnique.mockResolvedValue(null);
    prisma.whatsAppPendingAction.findUnique.mockResolvedValue({
      id: 'action-id',
      status: WhatsAppActionStatus.PENDING,
      link: { id: 'link-id', familyId: 'family-id', userId: 'user-id' },
    });

    await expect(service.updateAction('action-id', 'Nuevo texto', 'user-id'))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('confirms WhatsApp notes through MessagesService so tone review and message audit run', async () => {
    const { service, prisma, audit, messages } = createService();
    prisma.whatsAppPendingAction.findUnique.mockResolvedValue({
      id: 'action-id',
      status: WhatsAppActionStatus.PENDING,
      type: WhatsAppActionType.NOTE,
      payload: { content: 'Sos una mierda' },
      originalText: 'Sos una mierda',
      mediaId: null,
      expiresAt: new Date(Date.now() + 60_000),
      link: { id: 'link-id', familyId: 'family-id', userId: 'user-id', waId: null },
    });

    await service.confirmAction('action-id', 'user-id');

    expect(messages.create).toHaveBeenCalledWith('family-id', { content: 'Sos una mierda' }, 'user-id');
    expect(prisma.whatsAppPendingAction.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: WhatsAppActionStatus.CONFIRMED,
        resultEntityId: 'message-id',
      }),
    }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'CONFIRM_WHATSAPP_NOTE',
      entity: 'ChatMessage',
      entityId: 'message-id',
      metadata: expect.objectContaining({ source: 'WHATSAPP', assistantSuggested: true }),
    }));
  });
});

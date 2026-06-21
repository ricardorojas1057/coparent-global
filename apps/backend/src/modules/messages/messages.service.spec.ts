import { MessagesService } from './messages.service';

describe('MessagesService idempotency', () => {
  it('returns the existing message when an offline retry uses the same mutation id', async () => {
    const existing = {
      id: 'message-id',
      familyId: 'family-id',
      senderId: 'user-id',
      content: 'Horario confirmado',
      reads: [],
    };
    const prisma = {
      family: { findFirst: jest.fn().mockResolvedValue({ id: 'family-id', settings: null }) },
      chatMessage: {
        findUnique: jest.fn().mockResolvedValue(existing),
        create: jest.fn(),
      },
    };
    const service = new MessagesService(prisma as never, { log: jest.fn() } as never);

    const result = await service.create(
      'family-id',
      { content: 'Horario confirmado', clientMutationId: 'offline-123' },
      'user-id',
    );

    expect(result.message).toBe(existing);
    expect(prisma.chatMessage.create).not.toHaveBeenCalled();
  });

  it('reviews hostile messages without requiring a premium entitlement', async () => {
    const prisma = {
      family: { findFirst: jest.fn().mockResolvedValue({ id: 'family-id', settings: { locale: 'es-AR' } }) },
    };
    const subscriptions = { assertEntitlement: jest.fn() };
    const service = new MessagesService(
      prisma as never,
      { log: jest.fn() } as never,
      undefined,
      subscriptions as never,
    );

    const result = await service.review('family-id', { content: 'Sos una forra de mierda.' }, 'user-id');

    expect(result.needsReview).toBe(true);
    expect(subscriptions.assertEntitlement).not.toHaveBeenCalled();
  });
});

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('removes Expo push tokens reported as no longer registered', async () => {
    const prisma = {
      family: {
        findUnique: jest.fn().mockResolvedValue({
          settings: { enablePushNotifications: true },
          members: [{ userId: 'actor-id' }, { userId: 'recipient-id' }],
        }),
      },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      devicePushToken: {
        findMany: jest.fn().mockResolvedValue([{ token: 'ExponentPushToken[expired]' }]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }],
      }),
    } as Response);

    const service = new NotificationsService(prisma as never);
    await service.notifyFamily({
      familyId: 'family-id',
      actorId: 'actor-id',
      title: 'Evento actualizado',
      body: 'Hay una novedad familiar.',
    });

    expect(prisma.devicePushToken.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ['ExponentPushToken[expired]'] } },
    });
  });

  it('does not call Expo when family push notifications are disabled', async () => {
    const prisma = {
      family: {
        findUnique: jest.fn().mockResolvedValue({
          settings: { enablePushNotifications: false },
          members: [{ userId: 'actor-id' }, { userId: 'recipient-id' }],
        }),
      },
    };
    const fetchSpy = jest.spyOn(global, 'fetch');

    const service = new NotificationsService(prisma as never);
    await service.notifyFamily({
      familyId: 'family-id',
      actorId: 'actor-id',
      title: 'Evento actualizado',
      body: 'Hay una novedad familiar.',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

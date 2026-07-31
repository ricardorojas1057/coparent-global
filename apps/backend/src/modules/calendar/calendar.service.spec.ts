import { ForbiddenException } from '@nestjs/common';
import { CalendarEventType, RelationshipMode } from '@prisma/client';
import { CalendarService } from './calendar.service';

describe('CalendarService create', () => {
  it('sends a generic push notification without exposing the event title', async () => {
    const prisma = {
      child: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'child-id',
          familyId: 'family-id',
          family: { members: [{ userId: 'parent-id' }, { userId: 'other-id' }] },
        }),
      },
      calendarEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event-id' }),
      },
    };
    const notifications = { notifyFamily: jest.fn() };
    const service = new CalendarService(
      prisma as never,
      { log: jest.fn() } as never,
      notifications as never,
    );

    await service.create(
      {
        childId: 'child-id',
        currentParentId: 'other-id',
        title: 'Turno medico privado',
        type: CalendarEventType.HEALTH,
        startDate: '2026-07-20T10:00:00.000Z',
        endDate: '2026-07-20T11:00:00.000Z',
      },
      'parent-id',
    );

    expect(notifications.notifyFamily).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Nuevo evento familiar',
      body: 'Hay una novedad en el calendario familiar.',
      data: { type: 'calendar-event', eventId: 'event-id' },
    }));
    expect(notifications.notifyFamily.mock.calls[0][0].body).not.toContain('Turno medico privado');
  });
});

describe('CalendarService relationship modes', () => {
  it('requires a change request from a non-owner in structured mode', async () => {
    const prisma = {
      calendarEvent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-id',
          createdById: 'owner-id',
          currentParentId: 'owner-id',
          startDate: new Date('2026-06-10T10:00:00Z'),
          endDate: new Date('2026-06-10T11:00:00Z'),
          child: {
            familyId: 'family-id',
            family: {
              settings: { relationshipMode: RelationshipMode.STRUCTURED },
              members: [{ userId: 'owner-id' }, { userId: 'other-id' }],
            },
          },
        }),
        update: jest.fn(),
      },
    };
    const service = new CalendarService(prisma as never, { log: jest.fn() } as never);

    await expect(service.update('event-id', { status: 'COMPLETED' }, 'other-id')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.calendarEvent.update).not.toHaveBeenCalled();
  });
});

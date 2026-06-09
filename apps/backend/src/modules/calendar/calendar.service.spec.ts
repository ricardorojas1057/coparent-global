import { ForbiddenException } from '@nestjs/common';
import { RelationshipMode } from '@prisma/client';
import { CalendarService } from './calendar.service';

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

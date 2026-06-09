import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CalendarEventStatus, RelationshipMode, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCalendarChangeRequestDto,
  CreateCalendarEventDto,
  ResolveCalendarChangeRequestDto,
  UpdateCalendarEventDto,
} from './calendar.dto';

const eventInclude = {
  child: { select: { id: true, firstName: true, lastName: true, familyId: true } },
  currentParent: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  changeRequests: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  findMine(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: { child: { family: { members: { some: { userId } } } } },
      include: eventInclude,
      orderBy: { startDate: 'asc' },
    });
  }

  findChangeRequests(userId: string) {
    return this.prisma.custodyChangeRequest.findMany({
      where: { calendarEvent: { child: { family: { members: { some: { userId } } } } } },
      include: { calendarEvent: { include: eventInclude } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateCalendarEventDto, userId: string) {
    const { startDate, endDate } = this.parseDates(dto.startDate, dto.endDate);
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
      include: { family: { include: { members: true } } },
    });
    if (!child || !child.family.members.some((member) => member.userId === userId)) {
      throw new ForbiddenException('No tenes permisos para crear eventos para este hijo/a.');
    }
    if (!child.family.members.some((member) => member.userId === dto.currentParentId)) {
      throw new BadRequestException('El progenitor asignado no integra esta familia.');
    }

    const event = await this.prisma.calendarEvent.create({
      data: { ...dto, startDate, endDate, createdById: userId },
      include: eventInclude,
    });
    await this.audit.log({
      userId,
      familyId: child.familyId,
      action: 'CREATE_CALENDAR_EVENT',
      entity: 'CalendarEvent',
      entityId: event.id,
      metadata: { ...dto },
    });
    await this.notifications?.notifyFamily({
      familyId: child.familyId,
      actorId: userId,
      title: 'Nuevo evento familiar',
      body: dto.title,
      data: { type: 'calendar-event', eventId: event.id },
    });
    return event;
  }

  async update(eventId: string, dto: UpdateCalendarEventDto, userId: string) {
    const event = await this.findEventForMember(eventId, userId);
    this.assertDirectEditAllowed(event, userId);
    const startDate = dto.startDate ? new Date(dto.startDate) : event.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : event.endDate;
    this.assertDateOrder(startDate, endDate);
    if (dto.currentParentId && !event.child.family.members.some((member) => member.userId === dto.currentParentId)) {
      throw new BadRequestException('El progenitor asignado no integra esta familia.');
    }
    const updated = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { ...dto, startDate, endDate },
      include: eventInclude,
    });
    await this.audit.log({
      userId,
      familyId: event.child.familyId,
      action: 'UPDATE_CALENDAR_EVENT',
      entity: 'CalendarEvent',
      entityId: eventId,
      metadata: { ...dto },
    });
    return updated;
  }

  async cancel(eventId: string, userId: string) {
    const event = await this.findEventForMember(eventId, userId);
    this.assertDirectEditAllowed(event, userId);
    const cancelled = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { status: CalendarEventStatus.CANCELLED },
      include: eventInclude,
    });
    await this.audit.log({
      userId,
      familyId: event.child.familyId,
      action: 'CANCEL_CALENDAR_EVENT',
      entity: 'CalendarEvent',
      entityId: eventId,
    });
    return cancelled;
  }

  async createChangeRequest(eventId: string, dto: CreateCalendarChangeRequestDto, userId: string) {
    const event = await this.findEventForMember(eventId, userId);
    const { startDate, endDate } = this.parseDates(dto.newStartDate, dto.newEndDate);
    const request = await this.prisma.custodyChangeRequest.create({
      data: {
        calendarEventId: eventId,
        requestedById: userId,
        newStartDate: startDate,
        newEndDate: endDate,
        reason: dto.reason,
      },
    });
    await this.audit.log({
      userId,
      familyId: event.child.familyId,
      action: 'REQUEST_CALENDAR_CHANGE',
      entity: 'CustodyChangeRequest',
      entityId: request.id,
      metadata: { eventId, ...dto },
    });
    return request;
  }

  async resolveChangeRequest(requestId: string, dto: ResolveCalendarChangeRequestDto, userId: string) {
    if (dto.status === RequestStatus.PENDING) throw new BadRequestException('La solicitud debe aceptarse o rechazarse.');
    const request = await this.prisma.custodyChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        calendarEvent: {
          include: { child: { include: { family: { include: { members: true, settings: true } } } } },
        },
      },
    });
    if (!request) throw new NotFoundException('No encontramos la solicitud.');
    const event = request.calendarEvent;
    if (!event.child.family.members.some((member) => member.userId === userId)) {
      throw new ForbiddenException('No integras esta familia.');
    }
    const ownerId = event.createdById ?? event.currentParentId;
    if (ownerId !== userId || request.requestedById === userId) {
      throw new ForbiddenException('Solo quien administra el evento puede resolver esta solicitud.');
    }
    if (request.status !== RequestStatus.PENDING) throw new BadRequestException('La solicitud ya fue resuelta.');

    const results = await this.prisma.$transaction([
      ...(dto.status === RequestStatus.ACCEPTED
        ? [
            this.prisma.calendarEvent.update({
              where: { id: event.id },
              data: { startDate: request.newStartDate, endDate: request.newEndDate, isOverride: true },
            }),
          ]
        : []),
      this.prisma.custodyChangeRequest.update({ where: { id: requestId }, data: { status: dto.status } }),
    ]);
    const resolved = results[results.length - 1];
    await this.audit.log({
      userId,
      familyId: event.child.familyId,
      action: dto.status === RequestStatus.ACCEPTED ? 'ACCEPT_CALENDAR_CHANGE' : 'REJECT_CALENDAR_CHANGE',
      entity: 'CustodyChangeRequest',
      entityId: requestId,
    });
    return resolved;
  }

  private async findEventForMember(eventId: string, userId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { child: { include: { family: { include: { members: true, settings: true } } } } },
    });
    if (!event) throw new NotFoundException('No encontramos el evento.');
    if (!event.child.family.members.some((member) => member.userId === userId)) {
      throw new ForbiddenException('No integras esta familia.');
    }
    return event;
  }

  private assertDirectEditAllowed(
    event: Awaited<ReturnType<CalendarService['findEventForMember']>>,
    userId: string,
  ) {
    const mode = event.child.family.settings?.relationshipMode ?? RelationshipMode.COOPERATIVE;
    const ownerId = event.createdById ?? event.currentParentId;
    if (mode !== RelationshipMode.COOPERATIVE && ownerId !== userId) {
      throw new ForbiddenException('En este modo debes enviar una solicitud de cambio.');
    }
  }

  private parseDates(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    this.assertDateOrder(startDate, endDate);
    return { startDate, endDate };
  }

  private assertDateOrder(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      throw new BadRequestException('La fecha de finalizacion debe ser posterior al inicio.');
    }
  }
}

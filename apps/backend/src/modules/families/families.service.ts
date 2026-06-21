import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { FamilyInvitationGuestResponse, FamilyInvitationStatus, FamilyRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AddFamilyMemberDto, CreateFamilyDto, CreateFamilyInvitationDto, UpdateFamilySettingsDto } from './families.dto';
import { MailService } from '../../common/mail/mail.service';
import * as crypto from 'crypto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const publicSubscriptionSelect = {
  id: true,
  familyId: true,
  plan: true,
  status: true,
  provider: true,
  googlePlayProductId: true,
  googlePlayBasePlanId: true,
  lastVerifiedAt: true,
  trialEndsAt: true,
  currentPeriodEndsAt: true,
  cancelAtPeriodEnd: true,
  requestedPlan: true,
  requestedAt: true,
};

@Injectable()
export class FamiliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    @Optional() private readonly subscriptions?: SubscriptionsService,
  ) {}

  findMine(userId: string) {
    return this.prisma.family.findMany({
      where: { members: { some: { userId } } },
      include: {
        tenant: true,
        members: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        children: true,
        settings: true,
        subscription: { select: publicSubscriptionSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateFamilyDto, userId: string) {
    const tenantMembership = await this.prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: dto.tenantId, userId } },
    });

    if (!tenantMembership) {
      throw new ForbiddenException('No tenes permisos para crear familias en este tenant.');
    }

    const family = await this.prisma.family.create({
      data: {
        tenantId: dto.tenantId,
        members: { create: { userId, role: FamilyRole.PRIMARY_PARENT } },
        settings: { create: {} },
        subscription: {
          create: {
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: { members: true, settings: true, subscription: { select: publicSubscriptionSelect } },
    });
    await this.audit.log({ userId, familyId: family.id, action: 'CREATE_FAMILY', entity: 'Family', entityId: family.id, metadata: { ...dto } });
    return family;
  }

  async addMember(familyId: string, dto: AddFamilyMemberDto, userId: string) {
    const requester = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!requester || requester.role !== FamilyRole.PRIMARY_PARENT) {
      throw new ForbiddenException('Solo el progenitor principal puede invitar integrantes.');
    }

    const invitedUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!invitedUser) {
      throw new NotFoundException('La persona debe registrarse en la app antes de ser invitada.');
    }

    const existing = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId: invitedUser.id } },
    });
    if (existing) {
      throw new ConflictException('La persona ya integra esta familia.');
    }

    const member = await this.prisma.familyMember.create({
      data: { familyId, userId: invitedUser.id, role: FamilyRole.SECONDARY_PARENT },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    await this.audit.log({
      userId,
      familyId,
      action: 'ADD_FAMILY_MEMBER',
      entity: 'FamilyMember',
      entityId: member.id,
      metadata: { invitedUserId: invitedUser.id, email: invitedUser.email },
    });
    return member;
  }

  async listInvitations(familyId: string, userId: string) {
    await this.assertPrimaryParent(familyId, userId);
    return this.prisma.familyInvitation.findMany({
      where: { familyId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        guestResponse: true,
        guestRespondedAt: true,
        createdAt: true,
        invitedBy: { select: { firstName: true, lastName: true } },
        acceptedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvitation(familyId: string, dto: CreateFamilyInvitationDto, userId: string) {
    await this.assertPrimaryParent(familyId, userId);
    const role = dto.role ?? FamilyRole.SECONDARY_PARENT;
    if (role === FamilyRole.PRIMARY_PARENT) {
      throw new BadRequestException('No se puede invitar otro progenitor principal.');
    }

    const email = dto.email?.trim().toLowerCase();
    if (email) {
      await this.prisma.familyInvitation.updateMany({
        where: { familyId, email, status: FamilyInvitationStatus.PENDING },
        data: { status: FamilyInvitationStatus.REVOKED, revokedAt: new Date() },
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await this.prisma.familyInvitation.create({
      data: {
        familyId,
        invitedById: userId,
        email,
        role,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: { family: { include: { tenant: true } } },
    });
    const delivery = email
      ? await this.mail.sendFamilyInvitation(email, token, invitation.family.tenant.name)
      : { delivered: false };
    await this.audit.log({
      userId,
      familyId,
      action: 'CREATE_FAMILY_INVITATION',
      entity: 'FamilyInvitation',
      entityId: invitation.id,
      metadata: { email: email ?? null, role },
    });
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      shareUrl: `${this.mail.publicWebUrl()}/invite?token=${encodeURIComponent(token)}`,
      delivered: delivery.delivered,
    };
  }

  async previewInvitation(token: string) {
    const invitation = await this.findInvitationByToken(token);
    return {
      status: this.publicInvitationStatus(invitation.status, invitation.expiresAt),
      familyName: invitation.family.tenant.name,
      inviter: invitation.invitedBy,
      role: invitation.role,
      emailHint: invitation.email ? this.maskEmail(invitation.email) : null,
      guestResponse: invitation.guestResponse,
      guestRespondedAt: invitation.guestRespondedAt,
      expiresAt: invitation.expiresAt,
    };
  }

  async respondToInvitation(token: string, response: FamilyInvitationGuestResponse) {
    const invitation = await this.findInvitationByToken(token);
    if (invitation.status !== FamilyInvitationStatus.PENDING || invitation.expiresAt <= new Date()) {
      throw new BadRequestException('La invitacion no esta disponible.');
    }
    const updated = await this.prisma.familyInvitation.update({
      where: { id: invitation.id },
      data: { guestResponse: response, guestRespondedAt: new Date() },
      select: { guestResponse: true, guestRespondedAt: true },
    });
    return {
      ...updated,
      message:
        response === FamilyInvitationGuestResponse.INTERESTED
          ? 'Tu interes quedo registrado. Para acceder a la familia debes iniciar sesion o crear una cuenta.'
          : 'Tu respuesta quedo registrada. No se creo ninguna cuenta ni acceso familiar.',
    };
  }

  async acceptInvitation(token: string, userId: string, userEmail: string) {
    const invitation = await this.findInvitationByToken(token);
    if (invitation.status !== FamilyInvitationStatus.PENDING || invitation.expiresAt <= new Date()) {
      throw new BadRequestException('La invitacion no esta disponible.');
    }
    if (invitation.email && invitation.email !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Esta invitacion fue creada para otro email.');
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const member = await tx.familyMember.upsert({
        where: { familyId_userId: { familyId: invitation.familyId, userId } },
        update: {},
        create: { familyId: invitation.familyId, userId, role: invitation.role },
      });
      await tx.familyInvitation.update({
        where: { id: invitation.id },
        data: {
          status: FamilyInvitationStatus.ACCEPTED,
          acceptedById: userId,
          acceptedAt: new Date(),
        },
      });
      return member;
    });
    await this.audit.log({
      userId,
      familyId: invitation.familyId,
      action: 'ACCEPT_FAMILY_INVITATION',
      entity: 'FamilyInvitation',
      entityId: invitation.id,
      metadata: { role: invitation.role },
    });
    return { familyId: invitation.familyId, familyName: invitation.family.tenant.name, membership };
  }

  async revokeInvitation(familyId: string, invitationId: string, userId: string) {
    await this.assertPrimaryParent(familyId, userId);
    const invitation = await this.prisma.familyInvitation.findFirst({ where: { id: invitationId, familyId } });
    if (!invitation) throw new NotFoundException('Invitacion no encontrada.');
    if (invitation.status !== FamilyInvitationStatus.PENDING) {
      throw new BadRequestException('Solo se pueden revocar invitaciones pendientes.');
    }
    const revoked = await this.prisma.familyInvitation.update({
      where: { id: invitation.id },
      data: { status: FamilyInvitationStatus.REVOKED, revokedAt: new Date() },
    });
    await this.audit.log({
      userId,
      familyId,
      action: 'REVOKE_FAMILY_INVITATION',
      entity: 'FamilyInvitation',
      entityId: invitation.id,
    });
    return revoked;
  }

  async updateSettings(familyId: string, dto: UpdateFamilySettingsDto, userId: string) {
    const membership = await this.assertMembership(familyId, userId);
    if (membership.role !== FamilyRole.PRIMARY_PARENT) {
      throw new ForbiddenException('Solo el progenitor principal puede modificar la configuracion familiar.');
    }
    const settings = await this.prisma.familySettings.upsert({
      where: { familyId },
      update: {
        ...dto,
        currency: dto.currency?.toUpperCase(),
        countryCode: dto.countryCode?.toUpperCase(),
      },
      create: {
        familyId,
        ...dto,
        currency: dto.currency?.toUpperCase(),
        countryCode: dto.countryCode?.toUpperCase(),
      },
    });
    await this.audit.log({
      userId,
      familyId,
      action: 'UPDATE_FAMILY_SETTINGS',
      entity: 'FamilySettings',
      entityId: settings.id,
      metadata: { ...dto },
    });
    return settings;
  }

  async exportArchive(familyId: string, userId: string) {
    await this.subscriptions?.assertEntitlement(familyId, userId, 'verifiedAuditExports');
    const family = await this.prisma.family.findFirst({
      where: { id: familyId, members: { some: { userId } } },
      include: {
        tenant: { select: { name: true, type: true } },
        settings: true,
        members: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        children: {
          include: {
            calendarEvents: {
              include: {
                currentParent: { select: { id: true, firstName: true, lastName: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true } },
                changeRequests: { orderBy: { createdAt: 'asc' } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        expenses: {
          include: {
            payer: { select: { id: true, firstName: true, lastName: true } },
            allocations: { orderBy: { updatedAt: 'asc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
        chatMessages: {
          include: {
            sender: { select: { id: true, firstName: true, lastName: true } },
            reads: { orderBy: { viewedAt: 'asc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
        auditLogs: { orderBy: [{ timestamp: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!family) throw new ForbiddenException('No integras esta familia.');

    const generatedAt = new Date().toISOString();
    const data = { version: 1, generatedAt, family };
    const digest = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    await this.audit.log({
      userId,
      familyId,
      action: 'EXPORT_FAMILY_ARCHIVE',
      entity: 'Family',
      entityId: familyId,
      metadata: { algorithm: 'SHA-256', digest },
    });
    return {
      manifest: {
        version: 1,
        generatedAt,
        algorithm: 'SHA-256',
        digest,
        notice:
          'El hash permite comprobar que este archivo no fue modificado despues de su generacion. No certifica validez legal universal.',
      },
      data,
    };
  }

  private async assertMembership(familyId: string, userId: string) {
    const membership = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!membership) throw new ForbiddenException('No integras esta familia.');
    return membership;
  }

  private async assertPrimaryParent(familyId: string, userId: string) {
    const membership = await this.assertMembership(familyId, userId);
    if (membership.role !== FamilyRole.PRIMARY_PARENT) {
      throw new ForbiddenException('Solo el progenitor principal puede administrar invitaciones.');
    }
    return membership;
  }

  private async findInvitationByToken(token: string) {
    const invitation = await this.prisma.familyInvitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: {
        family: { include: { tenant: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitacion no encontrada.');
    return invitation;
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private publicInvitationStatus(status: FamilyInvitationStatus, expiresAt: Date) {
    return status === FamilyInvitationStatus.PENDING && expiresAt <= new Date() ? 'EXPIRED' : status;
  }

  private maskEmail(email: string) {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
}

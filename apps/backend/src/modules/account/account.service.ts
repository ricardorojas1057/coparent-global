import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountDeletionStatus, FamilyRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdatePrivacySettingsDto } from './account.dto';
import * as crypto from 'crypto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async getPrivacy(userId: string) {
    const settings = await this.prisma.userPrivacySettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    const deletionRequest = await this.prisma.accountDeletionRequest.findFirst({
      where: { userId, status: AccountDeletionStatus.PENDING },
      orderBy: { requestedAt: 'desc' },
    });
    return { settings, deletionRequest };
  }

  async updatePrivacy(userId: string, dto: UpdatePrivacySettingsDto) {
    const settings = await this.prisma.userPrivacySettings.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
    await this.audit.log({
      userId,
      action: 'UPDATE_PRIVACY_SETTINGS',
      entity: 'UserPrivacySettings',
      entityId: settings.id,
      metadata: { ...dto },
    });
    return settings;
  }

  async requestDeletion(userId: string) {
    const existing = await this.prisma.accountDeletionRequest.findFirst({
      where: { userId, status: AccountDeletionStatus.PENDING },
    });
    if (existing) return existing;
    const request = await this.prisma.accountDeletionRequest.create({ data: { userId } });
    await this.audit.log({
      userId,
      action: 'REQUEST_ACCOUNT_DELETION',
      entity: 'AccountDeletionRequest',
      entityId: request.id,
    });
    return request;
  }

  async cancelDeletion(userId: string) {
    const request = await this.prisma.accountDeletionRequest.findFirst({
      where: { userId, status: AccountDeletionStatus.PENDING },
      orderBy: { requestedAt: 'desc' },
    });
    if (!request) throw new NotFoundException('No hay una solicitud de eliminacion pendiente.');
    if (request.status !== AccountDeletionStatus.PENDING) {
      throw new BadRequestException('La solicitud ya fue procesada.');
    }
    const cancelled = await this.prisma.accountDeletionRequest.update({
      where: { id: request.id },
      data: { status: AccountDeletionStatus.CANCELLED, cancelledAt: new Date() },
    });
    await this.audit.log({
      userId,
      action: 'CANCEL_ACCOUNT_DELETION',
      entity: 'AccountDeletionRequest',
      entityId: request.id,
    });
    return cancelled;
  }

  async completeDeletion(userId: string, confirmed: boolean) {
    if (!confirmed) throw new BadRequestException('Debes confirmar la eliminacion definitiva.');
    const request = await this.prisma.accountDeletionRequest.findFirst({
      where: { userId, status: AccountDeletionStatus.PENDING },
      orderBy: { requestedAt: 'desc' },
    });
    if (!request) throw new NotFoundException('Primero debes solicitar la eliminacion de la cuenta.');

    await this.audit.log({
      userId,
      action: 'COMPLETE_ACCOUNT_DELETION',
      entity: 'AccountDeletionRequest',
      entityId: request.id,
    });

    const promotionOperations: Prisma.PrismaPromise<unknown>[] = [];
    const primaryMemberships = await this.prisma.familyMember.findMany({
      where: { userId, role: FamilyRole.PRIMARY_PARENT },
      select: { familyId: true },
    });
    for (const membership of primaryMemberships) {
      const successor = await this.prisma.familyMember.findFirst({
        where: { familyId: membership.familyId, userId: { not: userId } },
        orderBy: { createdAt: 'asc' },
      });
      if (successor) {
        promotionOperations.push(
          this.prisma.familyMember.update({
            where: { id: successor.id },
            data: { role: FamilyRole.PRIMARY_PARENT },
          }),
        );
      }
    }

    const tombstone = crypto.randomUUID();
    await this.prisma.$transaction([
      ...promotionOperations,
      this.prisma.devicePushToken.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.whatsAppLink.deleteMany({ where: { userId } }),
      this.prisma.userPrivacySettings.deleteMany({ where: { userId } }),
      this.prisma.familyMember.deleteMany({ where: { userId } }),
      this.prisma.tenantUser.deleteMany({ where: { userId } }),
      this.prisma.accountDeletionRequest.update({
        where: { id: request.id },
        data: { status: AccountDeletionStatus.COMPLETED, completedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${tombstone}@deleted.invalid`,
          passwordHash: crypto.randomBytes(48).toString('hex'),
          googleSubject: null,
          firstName: 'Cuenta',
          lastName: 'eliminada',
          phone: null,
          emailVerifiedAt: null,
          deletedAt: new Date(),
          authVersion: { increment: 1 },
        },
      }),
    ]);
    return { deleted: true };
  }
}

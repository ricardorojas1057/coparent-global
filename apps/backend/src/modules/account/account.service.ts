import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountDeletionStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdatePrivacySettingsDto } from './account.dto';

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
}

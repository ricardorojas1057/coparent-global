import { ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMessageDto, ReviewMessageDto } from './messages.dto';
import { reviewCommunication } from './communication-assistant';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const messageInclude = {
  sender: { select: { id: true, firstName: true, lastName: true, email: true } },
  reads: { select: { userId: true, viewedAt: true } },
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Optional() private readonly notifications?: NotificationsService,
    @Optional() private readonly subscriptions?: SubscriptionsService,
  ) {}

  async findFamilyMessages(familyId: string, userId: string) {
    await this.assertMembership(familyId, userId);
    return this.prisma.chatMessage.findMany({
      where: { familyId, isDeleted: false },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async create(familyId: string, dto: CreateMessageDto, userId: string) {
    const family = await this.assertMembership(familyId, userId);
    if (dto.clientMutationId) {
      const existing = await this.prisma.chatMessage.findUnique({
        where: { clientMutationId: dto.clientMutationId },
        include: messageInclude,
      });
      if (existing) {
        if (existing.familyId !== familyId || existing.senderId !== userId) {
          throw new ForbiddenException('La identificacion de esta operacion ya fue utilizada.');
        }
        return { message: existing, review: { needsReview: false, reasons: [], suggestion: null } };
      }
    }
    const reviewEnabled = this.subscriptions
      ? await this.subscriptions.hasEntitlement(familyId, userId, 'toneAssistant')
      : true;
    const review = reviewEnabled
      ? reviewCommunication(dto.content, family.settings?.locale)
      : { needsReview: false, reasons: [], suggestion: null };
    const message = await this.prisma.chatMessage.create({
      data: {
        familyId,
        senderId: userId,
        content: dto.content.trim(),
        category: dto.category,
        clientMutationId: dto.clientMutationId,
        aiIntervened: review.needsReview,
        aiSuggestion: review.suggestion,
        reads: { create: { userId } },
      },
      include: messageInclude,
    });
    await this.audit.log({
      userId,
      familyId,
      action: 'SEND_FAMILY_MESSAGE',
      entity: 'ChatMessage',
      entityId: message.id,
      metadata: { category: message.category, assistantSuggested: review.needsReview },
    });
    await this.notifications?.notifyFamily({
      familyId,
      actorId: userId,
      title: 'Nuevo mensaje familiar',
      body: `${message.sender.firstName} envio un mensaje.`,
      data: { type: 'family-message', messageId: message.id },
    });
    return { message, review };
  }

  async review(familyId: string, dto: ReviewMessageDto, userId: string) {
    const family = await this.assertMembership(familyId, userId);
    await this.subscriptions?.assertEntitlement(familyId, userId, 'toneAssistant');
    return reviewCommunication(dto.content, dto.locale ?? family.settings?.locale);
  }

  async markViewed(familyId: string, messageId: string, userId: string) {
    await this.assertMembership(familyId, userId);
    const message = await this.prisma.chatMessage.findFirst({ where: { id: messageId, familyId } });
    if (!message) throw new NotFoundException('No encontramos el mensaje.');
    return this.prisma.chatMessageRead.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: {},
      create: { messageId, userId },
    });
  }

  private async assertMembership(familyId: string, userId: string) {
    const family = await this.prisma.family.findFirst({
      where: { id: familyId, members: { some: { userId } } },
      include: { settings: true },
    });
    if (!family) throw new ForbiddenException('No integras esta familia.');
    return family;
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  CalendarEventType,
  ExpenseCategory,
  Prisma,
  WhatsAppActionStatus,
  WhatsAppActionType,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CalendarService } from '../calendar/calendar.service';
import { ExpensesService } from '../expenses/expenses.service';
import { parseWhatsAppAction } from './whatsapp.parser';

type MetaMessage = {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
  image?: { id?: string; caption?: string };
};

type MetaWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: MetaMessage[];
      };
    }>;
  }>;
};

@Injectable()
export class WhatsAppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly expenses: ExpensesService,
    private readonly calendar: CalendarService,
  ) {}

  verifyWebhook(mode?: string, token?: string, challenge?: string) {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode !== 'subscribe' || !verifyToken || token !== verifyToken) {
      throw new ForbiddenException('No se pudo verificar el webhook.');
    }
    return challenge ?? '';
  }

  async createLinkCode(familyId: string, userId: string) {
    await this.assertMembership(familyId, userId);
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const link = await this.prisma.whatsAppLink.upsert({
      where: { userId_familyId: { userId, familyId } },
      update: { linkCodeHash: this.hash(code), codeExpiresAt: expiresAt },
      create: { userId, familyId, linkCodeHash: this.hash(code), codeExpiresAt: expiresAt },
    });
    await this.audit.log({
      userId,
      familyId,
      action: 'CREATE_WHATSAPP_LINK_CODE',
      entity: 'WhatsAppLink',
      entityId: link.id,
    });
    return {
      code,
      expiresAt,
      instruction: `Envia VINCULAR ${code} al WhatsApp oficial de Coparent.`,
    };
  }

  listLinks(userId: string) {
    return this.prisma.whatsAppLink.findMany({
      where: { userId },
      select: {
        id: true,
        familyId: true,
        linkedAt: true,
        waId: true,
        family: { select: { tenant: { select: { name: true } } } },
      },
    });
  }

  listActions(userId: string) {
    return this.prisma.whatsAppPendingAction.findMany({
      where: { link: { userId } },
      include: { link: { select: { familyId: true, family: { select: { tenant: { select: { name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async confirmAction(actionId: string, userId: string) {
    const action = await this.findOwnedAction(actionId, userId);
    if (action.status !== WhatsAppActionStatus.PENDING) {
      throw new BadRequestException('La accion ya fue procesada.');
    }
    if (action.expiresAt < new Date()) {
      throw new BadRequestException('La accion pendiente vencio.');
    }

    const claim = await this.prisma.whatsAppPendingAction.updateMany({
      where: { id: action.id, status: WhatsAppActionStatus.PENDING },
      data: { status: WhatsAppActionStatus.PROCESSING },
    });
    if (claim.count !== 1) {
      throw new BadRequestException('La accion ya esta siendo procesada.');
    }

    try {
      const payload = action.payload as Record<string, unknown>;
      let resultEntityId: string | undefined;
      if (action.type === WhatsAppActionType.EXPENSE) {
        const expense = await this.expenses.create({
          familyId: action.link.familyId,
          paidById: userId,
          description: String(payload.description),
          category: payload.category as ExpenseCategory,
          amount: Number(payload.amount),
        }, userId);
        resultEntityId = expense.id;
        if (action.mediaId) {
          await this.prisma.expense.update({
            where: { id: expense.id },
            data: { storageProvider: 'WHATSAPP', storageKey: action.mediaId },
          });
        }
      } else if (action.type === WhatsAppActionType.CALENDAR_EVENT) {
        const event = await this.calendar.create({
          childId: String(payload.childId),
          currentParentId: userId,
          title: 'Evento recibido por WhatsApp',
          type: CalendarEventType.OTHER,
          startDate: String(payload.startDate),
          endDate: String(payload.endDate),
        }, userId);
        resultEntityId = event.id;
      } else {
        const message = await this.prisma.chatMessage.create({
          data: {
            familyId: action.link.familyId,
            senderId: userId,
            content: String(payload.content),
            originalContent: action.mediaId ? `whatsapp-media:${action.mediaId}` : action.originalText,
          },
        });
        resultEntityId = message.id;
        await this.audit.log({
          userId,
          familyId: action.link.familyId,
          action: 'CONFIRM_WHATSAPP_NOTE',
          entity: 'ChatMessage',
          entityId: message.id,
        });
      }

      const updated = await this.prisma.whatsAppPendingAction.update({
        where: { id: action.id },
        data: { status: WhatsAppActionStatus.CONFIRMED, confirmedAt: new Date(), resultEntityId },
      });
      await this.sendText(action.link.waId, 'Listo. La informacion fue registrada en Coparent.');
      return updated;
    } catch (error) {
      await this.prisma.whatsAppPendingAction.update({
        where: { id: action.id },
        data: { status: WhatsAppActionStatus.FAILED },
      });
      throw error;
    }
  }

  async cancelAction(actionId: string, userId: string) {
    const action = await this.findOwnedAction(actionId, userId);
    const cancelled = await this.prisma.whatsAppPendingAction.updateMany({
      where: { id: action.id, status: WhatsAppActionStatus.PENDING },
      data: { status: WhatsAppActionStatus.CANCELLED },
    });
    if (cancelled.count !== 1) {
      throw new BadRequestException('Solo se pueden cancelar acciones pendientes.');
    }
    await this.sendText(action.link.waId, 'La accion pendiente fue cancelada.');
    return this.prisma.whatsAppPendingAction.findUnique({ where: { id: action.id } });
  }

  async processWebhook(request: RawBodyRequest<Request>, body: unknown) {
    this.assertSignature(request);
    const webhook = body as MetaWebhookBody;
    const messages = webhook.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) => change.value?.messages ?? []) ?? [],
    ) ?? [];
    for (const message of messages) {
      await this.processMessage(message);
    }
    return { received: true };
  }

  private async processMessage(message: MetaMessage) {
    if (await this.prisma.whatsAppPendingAction.findUnique({ where: { externalMessageId: message.id } })) return;
    const text = message.text?.body?.trim() ?? message.image?.caption?.trim() ?? '';
    const linkCode = text.match(/^vincular\s+(\d{6})$/i)?.[1];
    if (linkCode) {
      const link = await this.prisma.whatsAppLink.findFirst({
        where: { linkCodeHash: this.hash(linkCode), codeExpiresAt: { gt: new Date() } },
      });
      if (!link) {
        await this.sendText(message.from, 'El codigo no es valido o vencio. Genera uno nuevo desde Perfil.');
        return;
      }
      await this.prisma.whatsAppLink.update({
        where: { id: link.id },
        data: { waId: message.from, linkedAt: new Date(), linkCodeHash: null, codeExpiresAt: null },
      });
      await this.sendText(message.from, 'WhatsApp vinculado correctamente con Coparent.');
      return;
    }

    const link = await this.prisma.whatsAppLink.findUnique({
      where: { waId: message.from },
      include: { family: { include: { children: true } } },
    });
    if (!link) {
      await this.sendText(message.from, 'Este numero no esta vinculado. Genera un codigo desde Configuracion familiar en Coparent.');
      return;
    }

    const latestPending = await this.prisma.whatsAppPendingAction.findFirst({
      where: { linkId: link.id, status: WhatsAppActionStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    if (/^confirmar$/i.test(text) && latestPending) {
      await this.sendText(message.from, 'Por seguridad, confirma esta accion desde la app Coparent. WhatsApp solo deja acciones pendientes.');
      return;
    }
    if (/^cancelar$/i.test(text) && latestPending) {
      await this.sendText(message.from, 'Por seguridad, cancela esta accion desde la app Coparent. WhatsApp solo deja acciones pendientes.');
      return;
    }

    const parsed = parseWhatsAppAction(text, message.type === 'image');
    let payload: Prisma.InputJsonObject;
    if (parsed.type === WhatsAppActionType.EXPENSE) {
      payload = { description: parsed.description, amount: parsed.amount, category: parsed.category };
    } else if (parsed.type === WhatsAppActionType.CALENDAR_EVENT) {
      const child = link.family.children.find((item) =>
        `${item.firstName} ${item.lastName}`.toLowerCase().includes(parsed.childName.toLowerCase()),
      );
      if (!child) {
        await this.sendText(message.from, 'No encontre ese hijo/a en la familia. Revisa el nombre.');
        return;
      }
      payload = { childId: child.id, startDate: parsed.startDate.toISOString(), endDate: parsed.endDate.toISOString() };
    } else {
      payload = { content: parsed.content };
    }

    await this.prisma.whatsAppPendingAction.create({
      data: {
        linkId: link.id,
        externalMessageId: message.id,
        type: parsed.type,
        originalText: text || null,
        mediaId: message.image?.id,
        payload,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.sendText(message.from, `${this.describe(parsed.type, payload)}\nAbrí Coparent para confirmar o cancelar. Nada se registra automaticamente.`);
  }

  private describe(type: WhatsAppActionType, payload: Record<string, unknown>) {
    if (type === WhatsAppActionType.EXPENSE) return `Detecte un gasto de ${payload.amount}: ${payload.description}`;
    if (type === WhatsAppActionType.CALENDAR_EVENT) return `Detecte un evento desde ${payload.startDate} hasta ${payload.endDate}.`;
    return 'Recibi una nota o foto para guardar en Coparent.';
  }

  private async sendText(waId: string | null, body: string) {
    const token = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    if (!waId || !token || !phoneNumberId) return;
    const version = this.config.get<string>('WHATSAPP_GRAPH_VERSION') ?? 'v22.0';
    try {
      await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: waId, type: 'text', text: { body } }),
      });
    } catch {
      // A temporary Meta outage must not cause the webhook to create duplicate actions.
    }
  }

  private assertSignature(request: RawBodyRequest<Request>) {
    const secret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException('La integracion de WhatsApp todavia no esta configurada.');
      }
      return;
    }
    const signature = request.headers['x-hub-signature-256'];
    if (typeof signature !== 'string' || !request.rawBody) throw new ForbiddenException('Firma de webhook ausente.');
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(request.rawBody).digest('hex')}`;
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new ForbiddenException('Firma de webhook invalida.');
    }
  }

  private async findOwnedAction(actionId: string, userId: string) {
    const action = await this.prisma.whatsAppPendingAction.findUnique({
      where: { id: actionId },
      include: { link: true },
    });
    if (!action) throw new NotFoundException('No encontramos la accion pendiente.');
    if (action.link.userId !== userId) throw new ForbiddenException('No tenes permisos para procesar esta accion.');
    return action;
  }

  private async assertMembership(familyId: string, userId: string) {
    const membership = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!membership) throw new ForbiddenException('No integras esta familia.');
  }

  private hash(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}

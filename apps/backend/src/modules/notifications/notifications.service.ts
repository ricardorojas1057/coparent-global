import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterPushTokenDto } from './notifications.dto';

type FamilyNotification = {
  familyId: string;
  actorId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  details?: { error?: string };
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  registerDevice(userId: string, dto: RegisterPushTokenDto) {
    return this.prisma.devicePushToken.upsert({
      where: { token: dto.token },
      update: { userId, platform: dto.platform },
      create: { userId, token: dto.token, platform: dto.platform },
    });
  }

  async removeDevice(userId: string, token: string) {
    await this.prisma.devicePushToken.deleteMany({ where: { userId, token } });
    return { removed: true };
  }

  async notifyFamily(notification: FamilyNotification) {
    try {
      const family = await this.prisma.family.findUnique({
        where: { id: notification.familyId },
        include: { settings: true, members: { select: { userId: true } } },
      });
      if (!family?.settings?.enablePushNotifications) return;

      const recipientIds = family.members
        .map((member) => member.userId)
        .filter((userId) => userId !== notification.actorId);
      if (recipientIds.length === 0) return;

      await this.prisma.notification.createMany({
        data: recipientIds.map((userId) => ({
          userId,
          title: notification.title,
          body: notification.body,
        })),
      });
      const devices = await this.prisma.devicePushToken.findMany({
        where: { userId: { in: recipientIds } },
        select: { token: true },
      });
      if (devices.length === 0) return;

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          devices.map(({ token }) => ({
            to: token,
            sound: 'default',
            title: notification.title,
            body: notification.body,
            data: notification.data ?? {},
          })),
        ),
      });
      if (!response.ok) {
        this.logger.warn(`Expo Push respondio ${response.status}.`);
        return;
      }

      const payload = (await response.json()) as { data?: ExpoPushTicket[] | ExpoPushTicket };
      const tickets = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
      const invalidTokens = devices
        .filter((_, index) => tickets[index]?.details?.error === 'DeviceNotRegistered')
        .map(({ token }) => token);

      if (invalidTokens.length > 0) {
        await this.prisma.devicePushToken.deleteMany({ where: { token: { in: invalidTokens } } });
        this.logger.log(`Se eliminaron ${invalidTokens.length} tokens push vencidos.`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'error desconocido';
      this.logger.warn(`No se pudo enviar la notificacion: ${detail}`);
    }
  }
}

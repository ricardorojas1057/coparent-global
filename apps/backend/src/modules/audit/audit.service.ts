import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId: string;
    familyId?: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('coparent-audit-chain'))`;
      const lastLog = await tx.auditLog.findFirst({
        orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
      });
      const previousHash = lastLog?.recordHash ?? '0'.repeat(64);
      const timestamp = new Date();
      const payload = JSON.stringify({ ...params, timestamp: timestamp.toISOString(), previousHash });
      const recordHash = crypto.createHash('sha256').update(payload).digest('hex');

      return tx.auditLog.create({
        data: {
          userId: params.userId,
          familyId: params.familyId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          timestamp,
          previousHash,
          recordHash,
          metadata: params.metadata ?? {},
        },
      });
    });
  }
}

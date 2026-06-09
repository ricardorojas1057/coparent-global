import { Injectable } from '@nestjs/common';
import { TenantRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTenantDto } from './tenants.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  findMine(userId: string) {
    return this.prisma.tenant.findMany({
      where: { tenantUsers: { some: { userId } } },
      include: {
        tenantUsers: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateTenantDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: dto.name, type: dto.type } });
      await tx.tenantUser.create({ data: { tenantId: tenant.id, userId, role: TenantRole.OWNER } });
      return tenant;
    });
    await this.audit.log({ userId, action: 'CREATE_TENANT', entity: 'Tenant', entityId: result.id, metadata: { ...dto } });
    return result;
  }
}

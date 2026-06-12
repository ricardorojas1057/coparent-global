import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FamilyRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateChildDto, UpdateChildDto } from './children.dto';

@Injectable()
export class ChildrenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async create(dto: CreateChildDto, userId: string) {
    const familyMembership = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId: dto.familyId, userId } },
    });

    if (!familyMembership) {
      throw new ForbiddenException('No tenes permisos para agregar hijos/as a esta familia.');
    }
    await this.subscriptions.assertCanAddChild(dto.familyId, userId);

    const child = await this.prisma.child.create({
      data: { familyId: dto.familyId, firstName: dto.firstName, lastName: dto.lastName, birthDate: new Date(dto.birthDate), observations: dto.observations },
    });
    await this.audit.log({ userId, familyId: dto.familyId, action: 'CREATE_CHILD', entity: 'Child', entityId: child.id, metadata: { firstName: dto.firstName } });
    return child;
  }

  async update(childId: string, dto: UpdateChildDto, userId: string) {
    const child = await this.findAccessibleChild(childId, userId);
    const updated = await this.prisma.child.update({
      where: { id: childId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        observations: dto.observations,
      },
    });
    await this.audit.log({
      userId,
      familyId: child.familyId,
      action: 'UPDATE_CHILD',
      entity: 'Child',
      entityId: childId,
      metadata: { ...dto },
    });
    return updated;
  }

  async remove(childId: string, userId: string) {
    const child = await this.findAccessibleChild(childId, userId, FamilyRole.PRIMARY_PARENT);
    await this.prisma.child.delete({ where: { id: childId } });
    await this.audit.log({
      userId,
      familyId: child.familyId,
      action: 'DELETE_CHILD',
      entity: 'Child',
      entityId: childId,
      metadata: { firstName: child.firstName, lastName: child.lastName },
    });
    return { deleted: true };
  }

  private async findAccessibleChild(childId: string, userId: string, requiredRole?: FamilyRole) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: { family: { include: { members: { where: { userId } } } } },
    });

    if (!child) {
      throw new NotFoundException('No encontramos el hijo/a.');
    }

    const membership = child.family.members[0];
    if (!membership || (requiredRole && membership.role !== requiredRole)) {
      throw new ForbiddenException('No tenes permisos para realizar esta accion.');
    }

    return child;
  }
}

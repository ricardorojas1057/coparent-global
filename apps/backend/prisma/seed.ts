import 'dotenv/config';
import { PrismaClient, TenantRole, TenantType, FamilyRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@coparent.ar' },
    update: {},
    create: { email: 'demo@coparent.ar', passwordHash, firstName: 'Demo', lastName: 'Coparent' },
  });
  const tenant = await prisma.tenant.create({ data: { name: 'Familia Demo', type: TenantType.B2C_DIRECT } });
  await prisma.tenantUser.create({ data: { tenantId: tenant.id, userId: user.id, role: TenantRole.OWNER } });
  const family = await prisma.family.create({
    data: {
      tenantId: tenant.id,
      settings: { create: {} },
      members: { create: { userId: user.id, role: FamilyRole.PRIMARY_PARENT } },
    },
  });
  await prisma.child.create({
    data: { familyId: family.id, firstName: 'Mateo', lastName: 'Demo', birthDate: new Date('2020-01-01') },
  });
  console.log({ user: user.email, tenantId: tenant.id, familyId: family.id });
}

main().finally(async () => prisma.$disconnect());

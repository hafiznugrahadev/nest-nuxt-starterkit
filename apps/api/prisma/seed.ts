import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/common/utils/password';

// Single root .env (cwd = apps/api when run via `bun run --filter`). Env vars win.
config({ path: ['../../.env', '.env'] });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Roles are data (M2M). Upsert the well-known ones; add more rows freely.
  const [adminRole, userRole] = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
    prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } }),
  ]);

  // Admin holds BOTH roles (demonstrates a multi-role user); `set` keeps re-seeds idempotent.
  const admin = await prisma.user.upsert({
    where: { email: 'admin@starterkit.test' },
    update: { roles: { set: [{ id: adminRole.id }, { id: userRole.id }] } },
    create: {
      email: 'admin@starterkit.test',
      name: 'Admin',
      password: await hashPassword('admin123'),
      roles: { connect: [{ id: adminRole.id }, { id: userRole.id }] },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@starterkit.test' },
    update: { roles: { set: [{ id: userRole.id }] } },
    create: {
      email: 'user@starterkit.test',
      name: 'Regular User',
      password: await hashPassword('user1234'),
      roles: { connect: [{ id: userRole.id }] },
    },
  });

  console.log('Seed complete:', { admin: admin.email, user: user.email, roles: ['ADMIN', 'USER'] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

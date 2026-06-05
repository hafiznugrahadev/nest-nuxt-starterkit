import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/common/utils/password';

// Single root .env (cwd = apps/api when run via `bun run --filter`). Env vars win.
config({ path: ['../../.env', '.env'] });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@starterkit.test' },
    update: {},
    create: {
      email: 'admin@starterkit.test',
      name: 'Admin',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@starterkit.test' },
    update: {},
    create: {
      email: 'user@starterkit.test',
      name: 'Regular User',
      password: await hashPassword('user1234'),
      role: 'USER',
    },
  });

  console.log('Seed complete:', { admin: admin.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/utils/password';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@minisoccer.test' },
    update: {},
    create: {
      email: 'admin@minisoccer.test',
      name: 'Admin',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@minisoccer.test' },
    update: {},
    create: {
      email: 'customer@minisoccer.test',
      name: 'Budi Customer',
      password: await hashPassword('customer123'),
      role: 'CUSTOMER',
    },
  });

  const fields = await Promise.all(
    [
      { name: 'Lapangan A (Indoor)', type: 'INDOOR' as const, pricePerHour: 150000 },
      { name: 'Lapangan B (Sintetis)', type: 'SYNTHETIC' as const, pricePerHour: 120000 },
      { name: 'Lapangan C (Outdoor)', type: 'OUTDOOR' as const, pricePerHour: 90000 },
    ].map((f) =>
      prisma.field.create({
        data: { ...f, description: `${f.name} — mini soccer 5v5` },
      }),
    ),
  );

  await prisma.booking.create({
    data: {
      fieldId: fields[0].id,
      customerId: customer.id,
      date: new Date('2026-06-10'),
      startTime: '19:00',
      endTime: '21:00',
      status: 'CONFIRMED',
      totalPrice: fields[0].pricePerHour * 2,
      notes: 'Booking reguler',
    },
  });

  console.log('Seed complete:', {
    admin: admin.email,
    customer: customer.email,
    fields: fields.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

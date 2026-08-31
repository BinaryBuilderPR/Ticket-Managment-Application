import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';
import { hashPassword } from 'better-auth/crypto';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env'
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists — skipping.`);
    return;
  }

  const hashedPassword = await hashPassword(password);
  const userId = crypto.randomUUID();
  const now = new Date();

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name: 'Admin',
        email,
        emailVerified: false,
        role: Role.ADMIN,
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        accountId: userId,
        providerId: 'credential',
        issuer: 'local:credential',
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  console.log(`✅ Admin user ${email} created successfully with role ${Role.ADMIN}.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

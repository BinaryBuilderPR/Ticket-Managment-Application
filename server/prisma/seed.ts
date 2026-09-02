import { PrismaClient, Role } from '@prisma/client';
import dotenv from 'dotenv';
import { hashPassword } from 'better-auth/crypto';

dotenv.config();

const prisma = new PrismaClient();

async function createStaffUser(
  email: string,
  password: string,
  name: string,
  role: Role
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  User ${email} (${role}) already exists — skipping.`);
    return;
  }

  const hashedPassword = await hashPassword(password);
  const userId = crypto.randomUUID();
  const now = new Date();

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: true,
        role,
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

  console.log(`✅ Seeded ${role} user: ${email} (${name})`);
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  const agentEmail = process.env.SEED_AGENT_EMAIL || process.env.AGENT_EMAIL;
  const agentPassword = process.env.SEED_AGENT_PASSWORD || process.env.AGENT_PASSWORD;
  const agentName = process.env.AGENT_NAME || 'Support Agent';

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env'
    );
  }

  // Seed Admin Account
  await createStaffUser(adminEmail, adminPassword, adminName, Role.ADMIN);

  // Seed Agent Account if configured
  if (agentEmail && agentPassword) {
    await createStaffUser(agentEmail, agentPassword, agentName, Role.AGENT);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

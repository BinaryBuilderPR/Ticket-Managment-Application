import { PrismaClient, Role, TicketCategory, TicketStatus, SenderType } from '@prisma/client';
import dotenv from 'dotenv';
import { hashPassword } from 'better-auth/crypto';
import { generateId } from 'better-auth';

dotenv.config();

// 1. Standalone PrismaClient instance (no Better Auth instance import)
const prisma = new PrismaClient();

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  // 2. Check if admin user already exists (idempotent)
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`ℹ️ Admin user already exists (${adminEmail}) - skipping creation.`);
    return existingUser;
  }

  // 3. Hash password using Better Auth scrypt algorithm
  const hashedPassword = await hashPassword(adminPassword);

  // 4. Generate unique IDs using Better Auth generateId
  const userId = generateId();
  const accountId = generateId();

  // 5. Create User + Account inside an atomic Prisma $transaction
  const newAdmin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: userId,
        email: adminEmail,
        name: adminName,
        role: Role.ADMIN,
        emailVerified: true,
      },
    });

    await tx.account.create({
      data: {
        id: accountId,
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        issuer: 'local:credential',
        password: hashedPassword,
      },
    });

    return user;
  });

  console.log(`✅ Admin user created successfully via $transaction:`);
  console.log(`   ID: ${newAdmin.id}`);
  console.log(`   Email: ${newAdmin.email}`);
  console.log(`   Role: ${newAdmin.role}`);
  console.log(`   Name: ${newAdmin.name}\n`);

  return newAdmin;
}

async function seedAgentUser() {
  const agentEmail = process.env.AGENT_EMAIL || 'agent@example.com';
  const agentPassword = process.env.AGENT_PASSWORD || 'password123';
  const agentName = process.env.AGENT_NAME || 'Support Agent';

  const existingUser = await prisma.user.findUnique({
    where: { email: agentEmail },
  });

  if (existingUser) {
    console.log(`ℹ️ Support agent already exists (${agentEmail}) - skipping creation.`);
    return existingUser;
  }

  const hashedPassword = await hashPassword(agentPassword);
  const userId = generateId();
  const accountId = generateId();

  const newAgent = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: userId,
        email: agentEmail,
        name: agentName,
        role: Role.AGENT,
        emailVerified: true,
      },
    });

    await tx.account.create({
      data: {
        id: accountId,
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        issuer: 'local:credential',
        password: hashedPassword,
      },
    });

    return user;
  });

  console.log(`✅ Support agent created successfully via $transaction:`);
  console.log(`   ID: ${newAgent.id}`);
  console.log(`   Email: ${newAgent.email}`);
  console.log(`   Role: ${newAgent.role}`);
  console.log(`   Name: ${newAgent.name}\n`);

  return newAgent;
}

async function seedKnowledgeBaseAndTickets(adminId: string, agentId: string) {
  // Sample Knowledge Base Documents
  const kbDocs = [
    {
      title: 'Refund and Cancellation Policy',
      content: `Our refund policy permits full refunds within 14 days of course enrollment if less than 20% of the course materials have been accessed. After 14 days or once 20% of the content is completed, tuition is non-refundable. Students requesting refunds must submit their transaction ID or billing invoice. Standard refund processing takes 5-7 business days back to the original payment method.`,
    },
    {
      title: 'Platform Access and Password Reset Guide',
      content: `If you are unable to log into the student portal, verify you are using your registered university email. You can trigger a password reset link by visiting portal.institution.edu/forgot-password. If two-factor authentication (2FA) is locked or you lost your authenticator device, support agents can issue a temporary 24-hour bypass token after identity verification.`,
    },
  ];

  for (const doc of kbDocs) {
    const existing = await prisma.knowledgeBaseDocument.findFirst({
      where: { title: doc.title },
    });

    if (!existing) {
      await prisma.knowledgeBaseDocument.create({
        data: {
          title: doc.title,
          content: doc.content,
          createdById: adminId,
        },
      });
      console.log(`✅ Knowledge Base document created: "${doc.title}"`);
    }
  }

  // Sample Ticket
  const existingTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 1001 },
  });

  if (!existingTicket) {
    await prisma.ticket.create({
      data: {
        ticketNumber: 1001,
        studentEmail: 'alex.student@gmail.com',
        studentName: 'Alex Rivera',
        subject: 'Question about assignment submission deadline',
        status: TicketStatus.OPEN,
        category: TicketCategory.GENERAL_QUESTION,
        isEscalated: false,
        aiSummary: 'Student is inquiring if there is a grace period for the Module 3 assignment submission due tonight.',
        assignedAgentId: agentId,
        messages: {
          create: [
            {
              senderType: SenderType.STUDENT,
              body: 'Hi Support Team, I am running a bit late on the Module 3 project due to work commitments. Is there any grace period or late submission policy? Thanks!',
              isDraft: false,
            },
          ],
        },
      },
    });
    console.log('✅ Sample Ticket #1001 created.');
  }
}

async function main() {
  console.log('🌱 Starting database seed for helpdesk database...\n');

  const admin = await seedAdminUser();
  const agent = await seedAgentUser();
  await seedKnowledgeBaseAndTickets(admin.id, agent.id);

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

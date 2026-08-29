import { PrismaClient, Role, TicketCategory, TicketStatus, SenderType } from '@prisma/client';
import * as argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for helpdesk database...');

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@institution.edu';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword123!';
  const adminName = process.env.INITIAL_ADMIN_NAME || 'System Administrator';

  // 1. Create or update Default Admin
  const hashedPassword = await argon2.hash(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      name: adminName,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      name: adminName,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Admin user seeded: ${admin.email} (Role: ${admin.role})`);

  // 2. Create a demo Support Agent
  const agentEmail = 'agent@institution.edu';
  const agentPassword = await argon2.hash('AgentSecurePassword123!');
  const agent = await prisma.user.upsert({
    where: { email: agentEmail },
    update: {
      passwordHash: agentPassword,
      name: 'Sarah Connor (Support Agent)',
      role: Role.AGENT,
    },
    create: {
      email: agentEmail,
      passwordHash: agentPassword,
      name: 'Sarah Connor (Support Agent)',
      role: Role.AGENT,
    },
  });

  console.log(`✅ Support agent seeded: ${agent.email} (Role: ${agent.role})`);

  // 3. Seed Sample Knowledge Base Documents
  const kbDocs = [
    {
      title: 'Refund and Cancellation Policy',
      content: `Our refund policy permits full refunds within 14 days of course enrollment if less than 20% of the course materials have been accessed. After 14 days or once 20% of the content is completed, tuition is non-refundable. Students requesting refunds must submit their transaction ID or billing invoice. Standard refund processing takes 5-7 business days back to the original payment method.`,
    },
    {
      title: 'Platform Access and Password Reset Guide',
      content: `If you are unable to log into the student portal, verify you are using your registered university email. You can trigger a password reset link by visiting portal.institution.edu/forgot-password. If two-factor authentication (2FA) is locked or you lost your authenticator device, support agents can issue a temporary 24-hour bypass token after identity verification.`,
    },
    {
      title: 'Course Schedules, Assignments and Extensions',
      content: `All live lecture sessions are recorded and posted to the student dashboard within 24 hours. Assignment submissions have a grace period of 48 hours with a 5% late deduction per day. Students seeking medical or personal extensions beyond 48 hours must provide documentation to the academic review board.`,
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
          createdById: admin.id,
        },
      });
      console.log(`✅ Knowledge Base document created: "${doc.title}"`);
    }
  }

  // 4. Seed Sample Tickets
  const sampleTickets = [
    {
      ticketNumber: 1001,
      studentEmail: 'alex.student@gmail.com',
      studentName: 'Alex Rivera',
      subject: 'Question about assignment submission deadline',
      status: TicketStatus.OPEN,
      category: TicketCategory.GENERAL_QUESTION,
      isEscalated: false,
      aiSummary: 'Student is inquiring if there is a grace period for the Module 3 assignment submission due tonight.',
      messages: {
        create: [
          {
            senderType: SenderType.STUDENT,
            body: 'Hi Support Team, I am running a bit late on the Module 3 project due to work commitments. Is there any grace period or late submission policy? Thanks!',
            isDraft: false,
          },
          {
            senderType: SenderType.AI_DRAFT,
            body: 'Hi Alex,\n\nThanks for reaching out! Yes, all assignments have a 48-hour grace period with a minimal 5% late deduction per day.\n\nIf you anticipate needing a longer extension due to personal or medical circumstances, please let us know so we can assist you.\n\nBest regards,\nStudent Support Team',
            isDraft: true,
          },
        ],
      },
    },
    {
      ticketNumber: 1002,
      studentEmail: 'david.miller@gmail.com',
      studentName: 'David Miller',
      subject: 'URGENT: Requesting immediate refund - Course not as advertised',
      status: TicketStatus.OPEN,
      category: TicketCategory.REFUND_REQUEST,
      isEscalated: true,
      escalationReason: 'Student expressed frustration and demanded immediate full refund within 5 days of purchase.',
      aiSummary: 'Student enrolled 5 days ago and is requesting an immediate refund due to dissatisfaction. Flagged for human review.',
      assignedAgentId: agent.id,
      messages: {
        create: [
          {
            senderType: SenderType.STUDENT,
            body: 'I enrolled 5 days ago in the Full Stack course (Order #TK-99214). The syllabus differs from what was promised. I demand an immediate full refund to my card!',
            isDraft: false,
          },
          {
            senderType: SenderType.AI_DRAFT,
            body: 'Hi David,\n\nI understand your frustration and apologize for the inconvenience. Since you enrolled 5 days ago, your request is within our 14-day refund window.\n\nOur team is reviewing your transaction (Order #TK-99214) and will process the refund to your original payment method within 5-7 business days.\n\nBest regards,\nStudent Support Team',
            isDraft: true,
          },
        ],
      },
    },
  ];

  for (const t of sampleTickets) {
    const existing = await prisma.ticket.findUnique({
      where: { ticketNumber: t.ticketNumber },
    });
    if (!existing) {
      await prisma.ticket.create({ data: t });
      console.log(`✅ Sample Ticket #${t.ticketNumber} created.`);
    }
  }

  console.log('🎉 Database seeding for helpdesk completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


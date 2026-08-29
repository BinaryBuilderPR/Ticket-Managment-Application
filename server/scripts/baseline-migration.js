import { prisma } from '../dist/db/prisma.js';

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id VARCHAR(36) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at TIMESTAMPTZ,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT,
      rolled_back_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
    VALUES (gen_random_uuid()::text, 'baseline', now(), '20260829162600_init_better_auth', 1)
    ON CONFLICT DO NOTHING;
  `);

  console.log('✅ Baseline migration registered in _prisma_migrations table.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


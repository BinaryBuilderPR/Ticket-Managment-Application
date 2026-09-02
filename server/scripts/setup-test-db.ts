import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
const envTestPath = path.join(__dirname, '../.env.test');
dotenv.config({ path: envTestPath });

const testDbUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:1234@localhost:5432/helpdesk_test?schema=public';

const testDbName = 'helpdesk_test';

export async function setupTestDatabase() {
  console.log('====================================================');
  console.log('🧪 SETTING UP ISOLATED PLAYWRIGHT TEST DATABASE');
  console.log('====================================================\n');
  console.log(`Target Database: ${testDbName}`);
  console.log(`Connection URL:  ${testDbUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  // Parse postgres admin connection URL to connect to default postgres DB
  const urlObj = new URL(testDbUrl);
  const pgAdminUrl = `${urlObj.protocol}//${urlObj.username}:${urlObj.password}@${urlObj.host}/postgres`;

  const client = new pg.Client({ connectionString: pgAdminUrl });

  try {
    await client.connect();
    console.log('➡️ [Step 1] Checking if test database exists...');

    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [testDbName]
    );

    if (res.rowCount === 0) {
      console.log(`   Creating database "${testDbName}"...`);
      await client.query(`CREATE DATABASE "${testDbName}"`);
      console.log(`   ✅ Database "${testDbName}" created successfully.\n`);
    } else {
      console.log(`   ✅ Database "${testDbName}" already exists.\n`);
    }
  } catch (err: any) {
    console.error('❌ Failed to verify/create database:', err.message);
    throw err;
  } finally {
    await client.end();
  }

  // Push Prisma schema to test database
  console.log('➡️ [Step 2] Pushing Prisma schema to test database...');
  try {
    const serverDir = path.join(__dirname, '..');
    execSync('npx prisma db push --skip-generate', {
      cwd: serverDir,
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit',
    });
    console.log('   ✅ Prisma schema pushed to test database.\n');
  } catch (err: any) {
    console.error('❌ Failed to push schema to test database:', err.message);
    throw err;
  }

  // Seed test data into test database
  console.log('➡️ [Step 3] Seeding staff accounts into test database...');
  try {
    const serverDir = path.join(__dirname, '..');
    execSync('npx tsx prisma/seed.ts', {
      cwd: serverDir,
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit',
    });
    console.log('   ✅ Staff accounts seeded into test database.\n');
  } catch (err: any) {
    console.error('❌ Failed to seed test database:', err.message);
    throw err;
  }

  console.log('====================================================');
  console.log('🎉 TEST DATABASE SETUP COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].includes('setup-test-db')) {
  setupTestDatabase().catch((err) => {
    console.error('Fatal error during test DB setup:', err);
    process.exit(1);
  });
}

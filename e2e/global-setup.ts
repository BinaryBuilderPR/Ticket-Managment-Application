import { setupTestDatabase } from '../server/scripts/setup-test-db.js';

async function globalSetup() {
  await setupTestDatabase();
}

export default globalSetup;

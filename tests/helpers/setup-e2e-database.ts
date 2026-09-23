import { seedDatabase } from '../../src/server/db/seed'
import { createTestDatabase, dropTestDatabase } from './test-database'

const databaseName = process.env.DATABASE_NAME
if (!databaseName?.startsWith('marketplace_b2b_test_e2e_')) {
  throw new Error('A dedicated E2E database name is required.')
}

try {
  await dropTestDatabase(databaseName)
} catch {}

const connection = await createTestDatabase(databaseName)
try {
  await seedDatabase(connection.db)
} finally {
  await connection.client.end()
}

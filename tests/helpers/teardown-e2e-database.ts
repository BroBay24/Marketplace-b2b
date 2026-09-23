import { dropTestDatabase } from './test-database'

export default async function teardownE2eDatabase() {
  const databaseName = process.env.DATABASE_NAME
  if (!databaseName?.startsWith('marketplace_b2b_test_e2e_')) {
    throw new Error('A dedicated E2E database name is required.')
  }
  await dropTestDatabase(databaseName)
}

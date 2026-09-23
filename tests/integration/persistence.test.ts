import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import { eq } from 'drizzle-orm'
import { seedDatabase, seedIds } from '../../src/server/db/seed'
import { products } from '../../src/server/db/schema'
import {
  createTestDatabase,
  dropTestDatabase,
  testDatabaseName,
  testDatabaseRoot,
  testDatabaseSocket,
} from '../helpers/test-database'

const databaseName = testDatabaseName('persist')
const run = (args: string[]) =>
  execFileSync('pnpm', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_URL: '',
      DATABASE_SOCKET: testDatabaseSocket,
      LOCAL_DB_ROOT: testDatabaseRoot,
    },
  }).trim()

test('committed catalog data survives new processes and PostgreSQL restart', async () => {
  const connection = await createTestDatabase(databaseName)
  try {
    await seedDatabase(connection.db)
    await connection.db
      .update(products)
      .set({ sku: 'PERSISTED' })
      .where(eq(products.id, seedIds.productA))
  } finally {
    await connection.client.end()
  }

  try {
    assert.equal(
      run([
        'exec',
        'tsx',
        'tests/helpers/read-persisted-catalog.ts',
        databaseName,
      ]),
      '["PERSISTED"]',
    )
    run(['db:stop'])
    run(['db:start'])
    assert.equal(
      run([
        'exec',
        'tsx',
        'tests/helpers/read-persisted-catalog.ts',
        databaseName,
      ]),
      '["PERSISTED"]',
    )
  } finally {
    run(['db:start'])
    await dropTestDatabase(databaseName)
  }
})

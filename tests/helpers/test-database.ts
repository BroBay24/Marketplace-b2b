import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { createDatabase } from '../../src/server/db/connection'

export const testDatabaseRoot = resolve(process.cwd(), '.local/postgres-test')
export const testDatabaseSocket = resolve(testDatabaseRoot, 'socket')
const prefix = 'marketplace_b2b_test_'

function assertSafeName(name: string) {
  if (!new RegExp(`^${prefix}[a-z0-9_]+$`).test(name)) {
    throw new Error(`Unsafe test database name: ${name}`)
  }
}

function createAdminClient() {
  return postgres({
    host: testDatabaseSocket,
    database: 'postgres',
    username: userInfo().username,
    max: 1,
  })
}

export function testDatabaseName(label: string) {
  return `${prefix}${label}_${process.pid}_${randomUUID().slice(0, 8)}`
}

export async function createTestDatabase(name: string, applyMigrations = true) {
  assertSafeName(name)
  const admin = createAdminClient()
  await admin.unsafe(`CREATE DATABASE "${name}"`)
  await admin.end()
  const connection = createDatabase(null, {
    database: name,
    host: testDatabaseSocket,
    max: 1,
  })
  if (applyMigrations) {
    await migrate(connection.db, { migrationsFolder: './drizzle' })
  }
  return connection
}

export async function dropTestDatabase(name: string) {
  assertSafeName(name)
  const admin = createAdminClient()
  try {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
  } finally {
    await admin.end()
  }
}

export async function applyMigrationFile(
  client: ReturnType<typeof postgres>,
  file: string,
) {
  const sql = await readFile(resolve(process.cwd(), file), 'utf8')
  for (const statement of sql.split('--> statement-breakpoint')) {
    if (statement.trim()) await client.unsafe(statement)
  }
}

export async function recordFoundationMigration(
  client: ReturnType<typeof postgres>,
) {
  await client.unsafe('CREATE SCHEMA drizzle')
  await client.unsafe(`
    CREATE TABLE drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `)
  await client`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES ('legacy-foundation', 1790118062926)
  `
}

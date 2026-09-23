import { userInfo } from 'node:os'
import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/** Create lazily on the server; importing this module never opens a connection. */
export function createDatabase(
  connectionString: string | null | undefined = process.env.DATABASE_URL,
  overrides: { database?: string; host?: string; max?: number } = {},
) {
  const options = { max: 5, connect_timeout: 5, idle_timeout: 20, ...overrides }
  const client = connectionString
    ? postgres(connectionString, options)
    : postgres({
        ...options,
        host:
          process.env.DATABASE_SOCKET ??
          resolve(process.cwd(), '.local/postgres/socket'),
        database: process.env.DATABASE_NAME ?? 'marketplace_demo',
        username: userInfo().username,
        ...overrides,
      })

  return { client, db: drizzle(client, { schema }) }
}

export type Database = ReturnType<typeof createDatabase>['db']

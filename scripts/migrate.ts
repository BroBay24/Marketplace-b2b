import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { createDatabase } from '../src/server/db/connection'

const { db, client } = createDatabase()
try {
  await migrate(db, { migrationsFolder: './drizzle' })
  console.info('Database migrations applied.')
} finally {
  await client.end()
}

import { userInfo } from 'node:os'
import { resolve } from 'node:path'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: resolve(process.cwd(), '.local/postgres/socket'),
        database: 'marketplace_demo',
        user: userInfo().username,
      },
  strict: true,
})

import { createDatabase } from '../../src/server/db/connection'
import { queryCatalog } from '../../src/server/catalog.server'

const database = process.argv.at(2)
if (!database?.startsWith('marketplace_b2b_test_')) {
  throw new Error('A dedicated test database name is required.')
}

const { db, client } = createDatabase(null, { database, max: 1 })
try {
  const result = await queryCatalog({ q: 'PERSISTED' }, db)
  process.stdout.write(JSON.stringify(result.products.map(({ sku }) => sku)))
} finally {
  await client.end()
}

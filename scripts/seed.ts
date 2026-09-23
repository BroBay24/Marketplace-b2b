import { createDatabase } from '../src/server/db/connection'
import { seedDatabase } from '../src/server/db/seed'
import { assertDemoSeedAllowed } from '../src/server/db/seed-guard'

assertDemoSeedAllowed()
const { db, client } = createDatabase()
try {
  const result = await seedDatabase(db)
  console.info(
    `Demo seed complete; ${result.length} active products. Existing data preserved.`,
  )
} finally {
  await client.end()
}

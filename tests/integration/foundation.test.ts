import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, test } from 'node:test'
import { eq } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import type { Database } from '../../src/server/db/connection'
import { seedDatabase, seedIds } from '../../src/server/db/seed'
import {
  companies,
  inventory,
  productPriceTiers,
  products,
  supplierVerifications,
  users,
} from '../../src/server/db/schema'
import {
  findCatalogProduct,
  queryCatalog,
} from '../../src/server/catalog.server'
import {
  applyMigrationFile,
  createTestDatabase,
  dropTestDatabase,
  recordFoundationMigration,
  testDatabaseName,
} from '../helpers/test-database'

const databaseName = testDatabaseName('foundation')
let connection: Awaited<ReturnType<typeof createTestDatabase>>
let db: Database

describe('database foundation', { concurrency: false }, () => {
  before(async () => {
    connection = await createTestDatabase(databaseName, false)
    db = connection.db
  })

  beforeEach(async () => {
    await connection.client.unsafe('DROP SCHEMA IF EXISTS public CASCADE')
    await connection.client.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE')
    await connection.client.unsafe('CREATE SCHEMA public')
    await migrate(db, { migrationsFolder: './drizzle' })
    await seedDatabase(db)
  })

  after(async () => {
    await connection.client.end()
    await dropTestDatabase(databaseName)
  })

  test('migrates an empty database and seeds deterministically', async () => {
    const first = await seedDatabase(db)
    const second = await seedDatabase(db)
    assert.equal(first.length, 2)
    assert.deepEqual(second, first)

    const [counts] = await connection.client`
      SELECT
        (SELECT count(*)::int FROM companies) AS companies,
        (SELECT count(*)::int FROM users) AS users,
        (SELECT count(*)::int FROM products) AS products,
        (SELECT count(*)::int FROM product_price_tiers) AS tiers,
        (SELECT count(*)::int FROM inventory) AS inventory
    `
    assert.deepEqual(counts, {
      companies: 4,
      users: 5,
      products: 2,
      tiers: 3,
      inventory: 2,
    })
  })

  test('preserves deliberate product, tier, and stock edits on reseed', async () => {
    await db
      .update(products)
      .set({ basePriceIdr: 5_600 })
      .where(eq(products.id, seedIds.productA))
    await db
      .update(productPriceTiers)
      .set({ unitPriceIdr: 5_600 })
      .where(eq(productPriceTiers.productId, seedIds.productA))
    await db
      .update(inventory)
      .set({ onHand: 4_321 })
      .where(eq(inventory.productId, seedIds.productA))

    await seedDatabase(db)

    const [stored] = await connection.client`
      SELECT p.base_price_idr, t.unit_price_idr, i.on_hand
      FROM products p
      JOIN product_price_tiers t
        ON t.product_id = p.id AND t.minimum_quantity = 100
      JOIN inventory i ON i.product_id = p.id
      WHERE p.id = ${seedIds.productA}
    `
    assert.deepEqual(stored, {
      base_price_idr: 5_600,
      unit_price_idr: 5_600,
      on_hand: 4_321,
    })
  })

  test('rejects invalid company ownership, role, and inventory', async () => {
    await assert.rejects(
      db.insert(productPriceTiers).values({
        productId: seedIds.productA,
        supplierCompanyId: seedIds.supplierCompanyB,
        minimumQuantity: 9_999,
        unitPriceIdr: 1,
      }),
    )
    await assert.rejects(
      db.insert(users).values({
        id: '20000000-0000-4000-8000-000000000099',
        companyId: seedIds.buyerCompanyA,
        companyKind: 'buyer',
        role: 'supplier',
        name: 'Invalid Supplier',
        email: 'invalid.supplier@marketplace.example',
      }),
    )
    await assert.rejects(
      db
        .update(inventory)
        .set({ onHand: 1, reserved: 2 })
        .where(eq(inventory.productId, seedIds.productA)),
    )
  })

  test('returns only public fields from visible list and detail', async () => {
    const result = await queryCatalog({}, db)
    assert.equal(result.products.length, 2)
    const product = result.products.find(({ id }) => id === seedIds.productA)
    assert.ok(product)
    assert.deepEqual(Object.keys(product).sort(), [
      'availableStock',
      'basePriceIdr',
      'category',
      'description',
      'id',
      'imageUrl',
      'moq',
      'name',
      'priceTiers',
      'quantityStep',
      'sku',
      'supplier',
      'unit',
    ])
    assert.deepEqual(Object.keys(product.supplier).sort(), [
      'city',
      'id',
      'name',
    ])
    assert.equal(JSON.stringify(result).includes('documentReference'), false)
    assert.equal(JSON.stringify(result).includes('@marketplace.example'), false)

    const detail = await findCatalogProduct(seedIds.productA, db)
    assert.deepEqual(detail, product)

    for (const imagePath of [
      'https://tracker.example/product.png',
      '//tracker.example/product.png',
      '\\\\tracker.example\\product.png',
    ]) {
      await db
        .update(products)
        .set({ imagePath })
        .where(eq(products.id, seedIds.productA))
      assert.equal(
        (await findCatalogProduct(seedIds.productA, db))?.imageUrl,
        null,
      )
    }
  })

  test('combines literal search and category filtering', async () => {
    assert.equal((await queryCatalog({ q: '%' }, db)).products.length, 0)
    assert.deepEqual(
      (
        await queryCatalog({ q: 'KRD302015', category: 'kardus' }, db)
      ).products.map(({ id }) => id),
      [seedIds.productA],
    )
    assert.equal(
      (await queryCatalog({ q: 'KRD302015', category: 'plastik' }, db)).products
        .length,
      0,
    )
  })

  test('applies identical visibility rules to list and direct detail', async () => {
    for (const status of ['draft', 'archived'] as const) {
      await db
        .update(products)
        .set({ status })
        .where(eq(products.id, seedIds.productA))
      assert.equal(
        (await queryCatalog({}, db)).products.some(
          ({ id }) => id === seedIds.productA,
        ),
        false,
      )
      assert.equal(await findCatalogProduct(seedIds.productA, db), null)
    }
    await db
      .update(products)
      .set({ status: 'active' })
      .where(eq(products.id, seedIds.productA))

    for (const status of ['pending_review', 'suspended'] as const) {
      await db
        .update(supplierVerifications)
        .set({ status })
        .where(eq(supplierVerifications.companyId, seedIds.supplierCompanyA))
      assert.equal(
        (await queryCatalog({}, db)).products.some(
          ({ id }) => id === seedIds.productA,
        ),
        false,
      )
      assert.equal(await findCatalogProduct(seedIds.productA, db), null)
    }
    await db
      .update(supplierVerifications)
      .set({ status: 'approved' })
      .where(eq(supplierVerifications.companyId, seedIds.supplierCompanyA))

    await db
      .update(companies)
      .set({ status: 'suspended' })
      .where(eq(companies.id, seedIds.supplierCompanyA))
    assert.equal(
      (await queryCatalog({}, db)).products.some(
        ({ id }) => id === seedIds.productA,
      ),
      false,
    )
    assert.equal(await findCatalogProduct(seedIds.productA, db), null)
    await db
      .update(companies)
      .set({ status: 'active' })
      .where(eq(companies.id, seedIds.supplierCompanyA))
  })

  test('hides active products without valid tiers or inventory', async () => {
    await db
      .delete(productPriceTiers)
      .where(eq(productPriceTiers.productId, seedIds.productA))
    assert.equal(
      (await queryCatalog({}, db)).products.some(
        ({ id }) => id === seedIds.productA,
      ),
      false,
    )
    assert.equal(await findCatalogProduct(seedIds.productA, db), null)

    await db.insert(productPriceTiers).values({
      productId: seedIds.productA,
      supplierCompanyId: seedIds.supplierCompanyA,
      minimumQuantity: 100,
      unitPriceIdr: 5_600,
    })
    await db.delete(inventory).where(eq(inventory.productId, seedIds.productA))
    assert.equal(
      (await queryCatalog({}, db)).products.some(
        ({ id }) => id === seedIds.productA,
      ),
      false,
    )
    assert.equal(await findCatalogProduct(seedIds.productA, db), null)
  })
})

test('legacy migration rejects values outside the new FSD limits', async () => {
  const invalidDatabaseName = testDatabaseName('invalid_legacy')
  const invalid = await createTestDatabase(invalidDatabaseName, false)
  try {
    await applyMigrationFile(
      invalid.client,
      'drizzle/0000_marketplace_foundation.sql',
    )
    await recordFoundationMigration(invalid.client)
    await invalid.client`
      INSERT INTO companies (name, kind, city)
      VALUES (${'A'.repeat(121)}, 'supplier', 'Jakarta')
    `
    await assert.rejects(
      migrate(invalid.db, { migrationsFolder: './drizzle' }),
      /Cannot migrate companies/,
    )
    const [state] = await invalid.client`
      SELECT
        (SELECT count(*)::int FROM companies) AS companies,
        (SELECT count(*)::int FROM drizzle.__drizzle_migrations) AS migrations,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'companies' AND column_name = 'responsible_person'
        ) AS upgraded
    `
    assert.deepEqual(state, { companies: 1, migrations: 1, upgraded: false })
  } finally {
    await invalid.client.end()
    await dropTestDatabase(invalidDatabaseName)
  }
})

describe('legacy migration upgrade', { concurrency: false }, () => {
  const legacyDatabaseName = testDatabaseName('legacy')
  let legacy: Awaited<ReturnType<typeof createTestDatabase>>

  before(async () => {
    legacy = await createTestDatabase(legacyDatabaseName, false)
  })

  after(async () => {
    await legacy.client.end()
    await dropTestDatabase(legacyDatabaseName)
  })

  test('maps legacy statuses and backfills required company data', async () => {
    await applyMigrationFile(
      legacy.client,
      'drizzle/0000_marketplace_foundation.sql',
    )
    await recordFoundationMigration(legacy.client)
    await legacy.client`
      INSERT INTO companies (id, name, kind, city)
      VALUES
        (${seedIds.supplierCompanyA}, 'Legacy Supplier', 'supplier', 'Jakarta'),
        (${seedIds.supplierCompanyB}, 'Pending Supplier', 'supplier', 'Bandung')
    `
    await legacy.client`
      INSERT INTO users (id, role, name, email)
      VALUES (${seedIds.admin}, 'admin', 'Admin Legacy', 'admin.legacy@marketplace.example')
    `
    await legacy.client`
      INSERT INTO supplier_verifications (
        company_id, status, reviewed_by_user_id, reviewed_at
      ) VALUES
        (${seedIds.supplierCompanyA}, 'rejected', ${seedIds.admin}, now()),
        (${seedIds.supplierCompanyB}, 'pending', NULL, NULL)
    `

    await migrate(legacy.db, { migrationsFolder: './drizzle' })

    const [company] = await legacy.client`
      SELECT responsible_person FROM companies
      WHERE id = ${seedIds.supplierCompanyA}
    `
    const verifications = await legacy.client`
      SELECT company_id, status::text, review_note
      FROM supplier_verifications
      ORDER BY company_id
    `
    const enumValues = await legacy.client`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'verification_status'
      ORDER BY enumsortorder
    `
    assert.deepEqual(company, { responsible_person: 'Legacy Supplier' })
    assert.deepEqual(
      enumValues.map(({ enumlabel }) => enumlabel),
      ['pending_review', 'approved', 'changes_requested', 'suspended'],
    )
    assert.deepEqual(
      [...verifications],
      [
        {
          company_id: seedIds.supplierCompanyA,
          status: 'changes_requested',
          review_note: 'Dimigrasikan dari status verifikasi lama.',
        },
        {
          company_id: seedIds.supplierCompanyB,
          status: 'pending_review',
          review_note: null,
        },
      ],
    )
  })
})

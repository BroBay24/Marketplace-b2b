import { and, asc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { CatalogProduct, CatalogResult } from '../domain/catalog'
import { catalogProductIdSchema, catalogSearchSchema } from '../domain/catalog'
import { pricingInputSchema } from '../domain/product-rules'
import type { Database } from './db/connection'
import { createDatabase } from './db/connection'
import {
  categories,
  companies,
  inventory,
  productPriceTiers,
  products,
  supplierVerifications,
} from './db/schema'

let connection: ReturnType<typeof createDatabase> | undefined
function getDatabase() {
  connection ??= createDatabase()
  return connection.db
}

const visibleProduct = () =>
  and(
    eq(products.status, 'active'),
    eq(companies.status, 'active'),
    eq(supplierVerifications.status, 'approved'),
  )

async function selectPublicProducts(
  db: Database,
  filter?: SQL,
): Promise<CatalogProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      unit: products.unit,
      moq: products.minimumOrderQuantity,
      quantityStep: products.quantityStep,
      basePriceIdr: products.basePriceIdr,
      imageUrl: products.imagePath,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
      supplier: {
        id: companies.id,
        name: companies.name,
        city: companies.city,
      },
      availableStock: sql<number>`${inventory.onHand} - ${inventory.reserved}`,
    })
    .from(products)
    .innerJoin(companies, eq(products.supplierCompanyId, companies.id))
    .innerJoin(
      supplierVerifications,
      eq(companies.id, supplierVerifications.companyId),
    )
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(inventory, eq(products.id, inventory.productId))
    .where(and(visibleProduct(), filter))
    .orderBy(asc(products.name), asc(products.id))

  if (rows.length === 0) return []
  const tiers = await db
    .select({
      productId: productPriceTiers.productId,
      minQuantity: productPriceTiers.minimumQuantity,
      unitPriceIdr: productPriceTiers.unitPriceIdr,
    })
    .from(productPriceTiers)
    .where(
      inArray(
        productPriceTiers.productId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(productPriceTiers.minimumQuantity))
  const byProduct = new Map<string, CatalogProduct['priceTiers']>()
  for (const { productId, ...tier } of tiers) {
    const values = byProduct.get(productId) ?? []
    values.push(tier)
    byProduct.set(productId, values)
  }
  return rows.flatMap((row) => {
    const priceTiers = byProduct.get(row.id) ?? []
    const pricing = pricingInputSchema.safeParse({
      minimumOrderQuantity: row.moq,
      quantityStep: row.quantityStep,
      basePriceIdr: row.basePriceIdr,
      priceTiers: priceTiers.map((tier) => ({
        minimumQuantity: tier.minQuantity,
        unitPriceIdr: tier.unitPriceIdr,
      })),
    })
    return pricing.success
      ? [
          {
            ...row,
            imageUrl: row.imageUrl?.startsWith('/images/catalog/')
              ? row.imageUrl
              : null,
            priceTiers,
          },
        ]
      : []
  })
}

export async function queryCatalog(
  input: unknown,
  database?: Database,
): Promise<CatalogResult> {
  const { q, category } = catalogSearchSchema.parse(input)
  const db = database ?? getDatabase()
  // User text is a literal substring, including SQL LIKE wildcard characters.
  const search = q ? `%${q.replace(/[\\%_]/g, '\\$&')}%` : undefined
  const results = await selectPublicProducts(
    db,
    and(
      category ? eq(categories.slug, category) : undefined,
      search
        ? or(
            ilike(products.name, search),
            ilike(products.sku, search),
            ilike(companies.name, search),
          )
        : undefined,
    ),
  )
  const allVisibleProducts = await selectPublicProducts(db)
  const visibleCategories = [
    ...new Map(
      allVisibleProducts.map((product) => [
        product.category.id,
        product.category,
      ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, 'id'))
  return {
    products: results,
    categories: visibleCategories,
    hasVisibleProducts: allVisibleProducts.length > 0,
  }
}

export async function findCatalogProduct(
  id: string,
  database?: Database,
): Promise<CatalogProduct | null> {
  catalogProductIdSchema.parse({ id })
  const rows = await selectPublicProducts(
    database ?? getDatabase(),
    eq(products.id, id),
  )
  return rows[0] ?? null
}

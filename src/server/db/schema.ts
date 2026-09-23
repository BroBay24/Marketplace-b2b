import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const companyKind = pgEnum('company_kind', ['buyer', 'supplier'])
export const companyStatus = pgEnum('company_status', ['active', 'suspended'])
export const userRole = pgEnum('user_role', ['buyer', 'supplier', 'admin'])
export const verificationStatus = pgEnum('verification_status', [
  'pending_review',
  'approved',
  'changes_requested',
  'suspended',
])
export const productStatus = pgEnum('product_status', [
  'draft',
  'active',
  'archived',
])

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    responsiblePerson: varchar('responsible_person', { length: 100 }).notNull(),
    description: varchar('description', { length: 1000 }),
    kind: companyKind('kind').notNull(),
    status: companyStatus('status').notNull().default('active'),
    city: varchar('city', { length: 100 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique('companies_id_kind_unique').on(table.id, table.kind),
    check('companies_name_valid', sql`length(trim(${table.name})) >= 3`),
    check(
      'companies_responsible_person_valid',
      sql`length(trim(${table.responsiblePerson})) >= 2`,
    ),
    check('companies_city_not_blank', sql`length(trim(${table.city})) > 0`),
  ],
)

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id'),
    companyKind: companyKind('company_kind'),
    role: userRole('role').notNull(),
    status: companyStatus('status').notNull().default('active'),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    // Authentication credentials and sessions belong to the next implementation phase.
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(sql`lower(${table.email})`),
    unique('users_id_role_unique').on(table.id, table.role),
    unique('users_id_company_unique').on(table.id, table.companyId),
    unique('users_id_company_role_unique').on(
      table.id,
      table.companyId,
      table.role,
    ),
    foreignKey({
      name: 'users_company_kind_fk',
      columns: [table.companyId, table.companyKind],
      foreignColumns: [companies.id, companies.kind],
    }),
    check(
      'users_role_company_matches',
      sql`(${table.role} = 'admin' AND ${table.companyId} IS NULL AND ${table.companyKind} IS NULL)
        OR (${table.role} = 'buyer' AND ${table.companyId} IS NOT NULL AND ${table.companyKind} IS NOT NULL AND ${table.companyKind} = 'buyer')
        OR (${table.role} = 'supplier' AND ${table.companyId} IS NOT NULL AND ${table.companyKind} IS NOT NULL AND ${table.companyKind} = 'supplier')`,
    ),
    check('users_name_not_blank', sql`length(trim(${table.name})) > 0`),
    check(
      'users_email_normalized',
      sql`${table.email} = lower(trim(${table.email})) AND ${table.email} LIKE '%_@_%._%'`,
    ),
  ],
)

export const supplierVerifications = pgTable(
  'supplier_verifications',
  {
    companyId: uuid('company_id').primaryKey(),
    companyKind: companyKind('company_kind').notNull().default('supplier'),
    status: verificationStatus('status').notNull().default('pending_review'),
    documentReference: text('document_reference'),
    reviewedByUserId: uuid('reviewed_by_user_id'),
    reviewerRole: userRole('reviewer_role').notNull().default('admin'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNote: text('review_note'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: 'verifications_supplier_company_fk',
      columns: [table.companyId, table.companyKind],
      foreignColumns: [companies.id, companies.kind],
    }),
    foreignKey({
      name: 'verifications_admin_reviewer_fk',
      columns: [table.reviewedByUserId, table.reviewerRole],
      foreignColumns: [users.id, users.role],
    }),
    check(
      'verifications_supplier_only',
      sql`${table.companyKind} = 'supplier'`,
    ),
    check('verifications_admin_only', sql`${table.reviewerRole} = 'admin'`),
    check(
      'verifications_review_recorded',
      sql`${table.status} = 'pending_review' OR (${table.reviewedByUserId} IS NOT NULL AND ${table.reviewedAt} IS NOT NULL AND ${table.reviewNote} IS NOT NULL AND length(trim(${table.reviewNote})) > 0)`,
    ),
  ],
)

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdByUserId: uuid('created_by_user_id').notNull(),
    label: varchar('label', { length: 40 }).notNull(),
    recipientName: varchar('recipient_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 16 }).notNull(),
    street: varchar('street', { length: 250 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    province: varchar('province', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 5 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: 'addresses_creator_company_fk',
      columns: [table.createdByUserId, table.companyId],
      foreignColumns: [users.id, users.companyId],
    }),
    uniqueIndex('addresses_one_default_per_company')
      .on(table.companyId)
      .where(sql`${table.isDefault} AND ${table.archivedAt} IS NULL`),
    check(
      'addresses_postal_code_valid',
      sql`${table.postalCode} ~ '^[0-9]{5}$'`,
    ),
    check('addresses_phone_valid', sql`${table.phone} ~ '^[+]?[0-9]{8,15}$'`),
    check(
      'addresses_required_text',
      sql`length(trim(${table.label})) >= 2 AND length(trim(${table.recipientName})) >= 2 AND length(trim(${table.street})) >= 10 AND length(trim(${table.city})) > 0 AND length(trim(${table.province})) > 0`,
    ),
  ],
)

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 80 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
  },
  (table) => [
    check('categories_name_not_blank', sql`length(trim(${table.name})) > 0`),
    check(
      'categories_slug_valid',
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
  ],
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierCompanyId: uuid('supplier_company_id').notNull(),
    supplierKind: companyKind('supplier_kind').notNull().default('supplier'),
    createdByUserId: uuid('created_by_user_id').notNull(),
    creatorRole: userRole('creator_role').notNull().default('supplier'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    sku: varchar('sku', { length: 64 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull().unique(),
    name: varchar('name', { length: 140 }).notNull(),
    description: varchar('description', { length: 4000 }).notNull(),
    unit: varchar('unit', { length: 3 }).notNull().default('pcs'),
    minimumOrderQuantity: integer('minimum_order_quantity').notNull(),
    quantityStep: integer('quantity_step').notNull().default(1),
    basePriceIdr: integer('base_price_idr').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('IDR'),
    status: productStatus('status').notNull().default('draft'),
    imagePath: text('image_path'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique('products_supplier_sku_unique').on(
      table.supplierCompanyId,
      table.sku,
    ),
    unique('products_id_supplier_unique').on(table.id, table.supplierCompanyId),
    foreignKey({
      name: 'products_supplier_company_fk',
      columns: [table.supplierCompanyId, table.supplierKind],
      foreignColumns: [companies.id, companies.kind],
    }),
    foreignKey({
      name: 'products_creator_company_role_fk',
      columns: [
        table.createdByUserId,
        table.supplierCompanyId,
        table.creatorRole,
      ],
      foreignColumns: [users.id, users.companyId, users.role],
    }),
    index('products_catalog_idx').on(
      table.status,
      table.categoryId,
      table.name,
    ),
    check(
      'products_supplier_only',
      sql`${table.supplierKind} = 'supplier' AND ${table.creatorRole} = 'supplier'`,
    ),
    check('products_sku_valid', sql`${table.sku} ~ '^[A-Z0-9-]{1,64}$'`),
    check(
      'products_slug_valid',
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    check(
      'products_required_text',
      sql`length(trim(${table.name})) >= 5 AND length(trim(${table.description})) > 0 AND ${table.unit} = 'pcs'`,
    ),
    check(
      'products_quantity_valid',
      sql`${table.minimumOrderQuantity} > 0 AND ${table.quantityStep} > 0 AND ${table.minimumOrderQuantity} % ${table.quantityStep} = 0`,
    ),
    check('products_price_positive', sql`${table.basePriceIdr} > 0`),
    check('products_currency_idr', sql`${table.currency} = 'IDR'`),
  ],
)

export const productPriceTiers = pgTable(
  'product_price_tiers',
  {
    productId: uuid('product_id').notNull(),
    supplierCompanyId: uuid('supplier_company_id').notNull(),
    minimumQuantity: integer('minimum_quantity').notNull(),
    unitPriceIdr: integer('unit_price_idr').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.minimumQuantity] }),
    foreignKey({
      name: 'tiers_product_supplier_fk',
      columns: [table.productId, table.supplierCompanyId],
      foreignColumns: [products.id, products.supplierCompanyId],
    }),
    check('tiers_quantity_positive', sql`${table.minimumQuantity} > 0`),
    check('tiers_price_positive', sql`${table.unitPriceIdr} > 0`),
  ],
)

export const inventory = pgTable(
  'inventory',
  {
    productId: uuid('product_id').primaryKey(),
    supplierCompanyId: uuid('supplier_company_id').notNull(),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    updatedAt: updatedAt(),
  },
  (table) => [
    foreignKey({
      name: 'inventory_product_supplier_fk',
      columns: [table.productId, table.supplierCompanyId],
      foreignColumns: [products.id, products.supplierCompanyId],
    }),
    check(
      'inventory_quantities_valid',
      sql`${table.onHand} >= 0 AND ${table.reserved} >= 0 AND ${table.reserved} <= ${table.onHand}`,
    ),
  ],
)

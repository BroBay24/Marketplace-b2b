import { eq, inArray } from 'drizzle-orm'
import type { Database } from './connection'
import {
  addresses,
  categories,
  companies,
  inventory,
  productPriceTiers,
  products,
  supplierVerifications,
  users,
} from './schema'

export const seedIds = {
  buyerCompanyA: '10000000-0000-4000-8000-000000000001',
  buyerCompanyB: '10000000-0000-4000-8000-000000000002',
  supplierCompanyA: '10000000-0000-4000-8000-000000000003',
  supplierCompanyB: '10000000-0000-4000-8000-000000000004',
  buyerA: '20000000-0000-4000-8000-000000000001',
  buyerB: '20000000-0000-4000-8000-000000000002',
  supplierA: '20000000-0000-4000-8000-000000000003',
  supplierB: '20000000-0000-4000-8000-000000000004',
  admin: '20000000-0000-4000-8000-000000000005',
  cardboardCategory: '30000000-0000-4000-8000-000000000001',
  plasticCategory: '30000000-0000-4000-8000-000000000002',
  tapeCategory: '30000000-0000-4000-8000-000000000003',
  labelCategory: '30000000-0000-4000-8000-000000000004',
  productA: '40000000-0000-4000-8000-000000000001',
  productB: '40000000-0000-4000-8000-000000000002',
} as const

/** Deterministic fictitious fixtures. Re-running never resets edited data. */
export async function seedDatabase(db: Database) {
  await db.transaction(async (tx) => {
    await tx
      .insert(companies)
      .values([
        {
          id: seedIds.buyerCompanyA,
          name: 'UMKM Karya Mandiri (Demo)',
          responsiblePerson: 'Buyer A Demo',
          kind: 'buyer',
          city: 'Jakarta',
        },
        {
          id: seedIds.buyerCompanyB,
          name: 'UMKM Kreasi Nusantara (Demo)',
          responsiblePerson: 'Buyer B Demo',
          kind: 'buyer',
          city: 'Bandung',
        },
        {
          id: seedIds.supplierCompanyA,
          name: 'PT Sumber Kemasan Jaya',
          responsiblePerson: 'Supplier A Demo',
          kind: 'supplier',
          city: 'Jakarta',
        },
        {
          id: seedIds.supplierCompanyB,
          name: 'PT Kemasan Nusantara',
          responsiblePerson: 'Supplier B Demo',
          kind: 'supplier',
          city: 'Surabaya',
        },
      ])
      .onConflictDoNothing()

    await tx
      .insert(users)
      .values([
        {
          id: seedIds.buyerA,
          companyId: seedIds.buyerCompanyA,
          companyKind: 'buyer',
          role: 'buyer',
          name: 'Buyer A Demo',
          email: 'buyer.a@marketplace.example',
        },
        {
          id: seedIds.buyerB,
          companyId: seedIds.buyerCompanyB,
          companyKind: 'buyer',
          role: 'buyer',
          name: 'Buyer B Demo',
          email: 'buyer.b@marketplace.example',
        },
        {
          id: seedIds.supplierA,
          companyId: seedIds.supplierCompanyA,
          companyKind: 'supplier',
          role: 'supplier',
          name: 'Supplier A Demo',
          email: 'supplier.a@marketplace.example',
        },
        {
          id: seedIds.supplierB,
          companyId: seedIds.supplierCompanyB,
          companyKind: 'supplier',
          role: 'supplier',
          name: 'Supplier B Demo',
          email: 'supplier.b@marketplace.example',
        },
        {
          id: seedIds.admin,
          role: 'admin',
          name: 'Admin Demo',
          email: 'admin@marketplace.example',
        },
      ])
      .onConflictDoNothing()

    await tx
      .insert(supplierVerifications)
      .values([
        {
          companyId: seedIds.supplierCompanyA,
          status: 'approved',
          documentReference: 'demo://verification/supplier-a',
          reviewedByUserId: seedIds.admin,
          reviewedAt: new Date('2026-09-01T00:00:00Z'),
          reviewNote: 'Data fiktif khusus demonstrasi.',
        },
        {
          companyId: seedIds.supplierCompanyB,
          status: 'approved',
          documentReference: 'demo://verification/supplier-b',
          reviewedByUserId: seedIds.admin,
          reviewedAt: new Date('2026-09-01T00:00:00Z'),
          reviewNote: 'Data fiktif khusus demonstrasi.',
        },
      ])
      .onConflictDoNothing()

    await tx
      .insert(addresses)
      .values([
        {
          id: '50000000-0000-4000-8000-000000000001',
          companyId: seedIds.buyerCompanyA,
          createdByUserId: seedIds.buyerA,
          label: 'Kantor demo',
          recipientName: 'Buyer A Demo',
          phone: '+620000000001',
          street: 'Jalan Contoh Demo No. 1 (alamat fiktif)',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: '10110',
          isDefault: true,
        },
        {
          id: '50000000-0000-4000-8000-000000000002',
          companyId: seedIds.buyerCompanyB,
          createdByUserId: seedIds.buyerB,
          label: 'Kantor demo',
          recipientName: 'Buyer B Demo',
          phone: '+620000000002',
          street: 'Jalan Contoh Demo No. 2 (alamat fiktif)',
          city: 'Bandung',
          province: 'Jawa Barat',
          postalCode: '40111',
          isDefault: true,
        },
        {
          id: '50000000-0000-4000-8000-000000000003',
          companyId: seedIds.supplierCompanyA,
          createdByUserId: seedIds.supplierA,
          label: 'Gudang demo',
          recipientName: 'Supplier A Demo',
          phone: '+620000000003',
          street: 'Jalan Gudang Demo No. 3 (alamat fiktif)',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: '10110',
          isDefault: true,
        },
        {
          id: '50000000-0000-4000-8000-000000000004',
          companyId: seedIds.supplierCompanyB,
          createdByUserId: seedIds.supplierB,
          label: 'Gudang demo',
          recipientName: 'Supplier B Demo',
          phone: '+620000000004',
          street: 'Jalan Gudang Demo No. 4 (alamat fiktif)',
          city: 'Surabaya',
          province: 'Jawa Timur',
          postalCode: '60111',
          isDefault: true,
        },
      ])
      .onConflictDoNothing()

    await tx
      .insert(categories)
      .values([
        { id: seedIds.cardboardCategory, name: 'Kardus', slug: 'kardus' },
        { id: seedIds.plasticCategory, name: 'Plastik', slug: 'plastik' },
        { id: seedIds.tapeCategory, name: 'Lakban', slug: 'lakban' },
        { id: seedIds.labelCategory, name: 'Label', slug: 'label' },
      ])
      .onConflictDoNothing()

    // Publish only rows inserted by this invocation, after their dependent data exists.
    const inserted = await tx
      .insert(products)
      .values([
        {
          id: seedIds.productA,
          supplierCompanyId: seedIds.supplierCompanyA,
          createdByUserId: seedIds.supplierA,
          categoryId: seedIds.cardboardCategory,
          sku: 'KRD302015',
          slug: 'kardus-packing-30-20-15',
          name: 'Kardus Packing Ukuran 30×20×15 cm',
          description:
            'Kardus bergelombang untuk kebutuhan pengemasan dan pengiriman usaha. Ukuran 30 × 20 × 15 cm, dijual per pcs dengan harga grosir berdasarkan jumlah pembelian. Produk dan supplier merupakan data demo fiktif.',
          unit: 'pcs',
          minimumOrderQuantity: 100,
          quantityStep: 1,
          basePriceIdr: 5500,
          imagePath: '/images/catalog/box.svg',
        },
        {
          id: seedIds.productB,
          supplierCompanyId: seedIds.supplierCompanyB,
          createdByUserId: seedIds.supplierB,
          categoryId: seedIds.cardboardCategory,
          sku: 'KRDBESAR',
          slug: 'kardus-kirim-ukuran-besar',
          name: 'Kardus Kirim Ukuran Besar',
          description:
            'Kardus kirim berukuran besar untuk pengemasan barang usaha. Dijual per pcs dengan minimal pembelian 50 pcs. Produk dan supplier merupakan data demo fiktif.',
          unit: 'pcs',
          minimumOrderQuantity: 50,
          quantityStep: 1,
          basePriceIdr: 8000,
          imagePath: '/images/catalog/box.svg',
        },
      ])
      .onConflictDoNothing()
      .returning({ id: products.id })

    // Only attach fixtures to newly inserted products so a rerun preserves tier edits/deletions.
    for (const product of inserted) {
      if (product.id === seedIds.productA) {
        await tx.insert(productPriceTiers).values([
          {
            productId: seedIds.productA,
            supplierCompanyId: seedIds.supplierCompanyA,
            minimumQuantity: 100,
            unitPriceIdr: 5500,
          },
          {
            productId: seedIds.productA,
            supplierCompanyId: seedIds.supplierCompanyA,
            minimumQuantity: 501,
            unitPriceIdr: 5000,
          },
        ])
        await tx.insert(inventory).values({
          productId: seedIds.productA,
          supplierCompanyId: seedIds.supplierCompanyA,
          onHand: 5000,
          reserved: 0,
        })
      } else {
        await tx.insert(productPriceTiers).values({
          productId: seedIds.productB,
          supplierCompanyId: seedIds.supplierCompanyB,
          minimumQuantity: 50,
          unitPriceIdr: 8000,
        })
        await tx.insert(inventory).values({
          productId: seedIds.productB,
          supplierCompanyId: seedIds.supplierCompanyB,
          onHand: 2000,
          reserved: 0,
        })
      }
    }
    if (inserted.length > 0) {
      await tx
        .update(products)
        .set({ status: 'active' })
        .where(
          inArray(
            products.id,
            inserted.map((product) => product.id),
          ),
        )
    }
  })

  return db
    .select({ id: products.id, sku: products.sku, status: products.status })
    .from(products)
    .where(eq(products.status, 'active'))
}

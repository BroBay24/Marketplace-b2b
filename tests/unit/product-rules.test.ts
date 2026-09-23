import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  calculateProductPrice,
  inventoryInputSchema,
  pricingInputSchema,
  productInputSchema,
} from '../../src/domain/product-rules'

const pricing = {
  minimumOrderQuantity: 100,
  quantityStep: 1,
  basePriceIdr: 5_500,
  priceTiers: [
    { minimumQuantity: 100, unitPriceIdr: 5_500 },
    { minimumQuantity: 501, unitPriceIdr: 5_000 },
  ],
}

const product = {
  ...pricing,
  supplierCompanyId: '10000000-0000-4000-8000-000000000003',
  categoryId: '30000000-0000-4000-8000-000000000001',
  sku: 'KRD302015',
  slug: 'kardus-packing-30-20-15',
  name: 'Kardus Packing',
  description: 'Kardus untuk kebutuhan pengiriman.',
  unit: 'pcs' as const,
  currency: 'IDR' as const,
}

describe('product validation', () => {
  test('accepts the canonical product fields', () => {
    assert.equal(productInputSchema.parse(product).sku, 'KRD302015')
  })

  test('enforces FSD text and SKU boundaries', () => {
    for (const invalid of [
      { ...product, sku: 'sku-kecil' },
      { ...product, sku: 'KRD.302015' },
      { ...product, sku: `A${'B'.repeat(64)}` },
      { ...product, name: 'Abcd' },
      { ...product, name: 'A'.repeat(141) },
      { ...product, description: '' },
      { ...product, description: 'A'.repeat(4_001) },
      { ...product, unit: 'box' },
      { ...product, currency: 'USD' },
    ]) {
      assert.equal(productInputSchema.safeParse(invalid).success, false)
    }
  })

  test('rejects fractional, non-positive, and PostgreSQL-overflow pricing values', () => {
    for (const value of [-1, 0, 1.5, 2_147_483_648]) {
      assert.equal(
        pricingInputSchema.safeParse({ ...pricing, basePriceIdr: value })
          .success,
        false,
      )
    }
  })

  test('requires MOQ to be divisible by the quantity step', () => {
    assert.equal(
      pricingInputSchema.safeParse({
        ...pricing,
        minimumOrderQuantity: 100,
        quantityStep: 30,
      }).success,
      false,
    )
  })

  test('requires the first tier to match MOQ and base price', () => {
    assert.equal(
      pricingInputSchema.safeParse({
        ...pricing,
        priceTiers: [{ minimumQuantity: 101, unitPriceIdr: 5_500 }],
      }).success,
      false,
    )
    assert.equal(
      pricingInputSchema.safeParse({
        ...pricing,
        priceTiers: [{ minimumQuantity: 100, unitPriceIdr: 5_499 }],
      }).success,
      false,
    )
  })

  test('rejects duplicate, below-MOQ, and increasing-price tiers', () => {
    for (const priceTiers of [
      [
        { minimumQuantity: 100, unitPriceIdr: 5_500 },
        { minimumQuantity: 100, unitPriceIdr: 5_000 },
      ],
      [
        { minimumQuantity: 99, unitPriceIdr: 5_500 },
        { minimumQuantity: 100, unitPriceIdr: 5_500 },
      ],
      [
        { minimumQuantity: 100, unitPriceIdr: 5_500 },
        { minimumQuantity: 501, unitPriceIdr: 6_000 },
      ],
    ]) {
      assert.equal(
        pricingInputSchema.safeParse({ ...pricing, priceTiers }).success,
        false,
      )
    }
  })
})

describe('inventory validation', () => {
  test('accepts available stock and rejects invalid quantities', () => {
    assert.deepEqual(inventoryInputSchema.parse({ onHand: 10, reserved: 4 }), {
      onHand: 10,
      reserved: 4,
    })
    for (const invalid of [
      { onHand: -1, reserved: 0 },
      { onHand: 1.5, reserved: 0 },
      { onHand: 10, reserved: 11 },
    ]) {
      assert.equal(inventoryInputSchema.safeParse(invalid).success, false)
    }
  })
})

describe('all-units pricing', () => {
  test('keeps canonical 500 and 501 quantity boundaries', () => {
    assert.deepEqual(calculateProductPrice(pricing, 500), {
      quantity: 500,
      unitPriceIdr: 5_500,
      subtotalIdr: 2_750_000,
      currency: 'IDR',
    })
    assert.deepEqual(calculateProductPrice(pricing, 501), {
      quantity: 501,
      unitPriceIdr: 5_000,
      subtotalIdr: 2_505_000,
      currency: 'IDR',
    })
  })

  test('rejects quantities outside MOQ and step', () => {
    const stepped = { ...pricing, minimumOrderQuantity: 100, quantityStep: 10 }
    assert.throws(() => calculateProductPrice(stepped, 99), RangeError)
    assert.throws(() => calculateProductPrice(stepped, 101), RangeError)
  })

  test('rejects an unsafe subtotal', () => {
    const maximum = 2_147_483_647
    assert.throws(
      () =>
        calculateProductPrice(
          {
            minimumOrderQuantity: maximum,
            quantityStep: maximum,
            basePriceIdr: maximum,
            priceTiers: [{ minimumQuantity: maximum, unitPriceIdr: maximum }],
          },
          maximum,
        ),
      /Subtotal melebihi/,
    )
  })
})

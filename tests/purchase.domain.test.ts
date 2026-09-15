import { describe, expect, it } from 'vitest'
import {
  cartTotal,
  execute,
  expirePurchases,
  purchaseStatus,
  seedState,
  unitPrice,
  visibleState,
} from '../src/features/purchase/domain'
import type {
  Command,
  DemoState,
  Persona,
} from '../src/features/purchase/domain'

const address = {
  recipient: 'Andi Pratama',
  phone: '081234567890',
  street: 'Jl. Raya Rungkut No. 12',
  city: 'Surabaya',
}
const at = 1000000
const act = (s: DemoState, command: Command, actor: Persona = 'buyer') =>
  execute(s, actor, command, at)
function cart() {
  return act(
    act(seedState(), { type: 'cart', productId: 'packing', quantity: 100 }),
    { type: 'cart', productId: 'large', quantity: 50 },
  )
}
function checkout() {
  return act(cart(), { type: 'checkout', expectedTotal: 995000, address })
}
function paid() {
  const s = checkout()
  return act(s, {
    type: 'payment',
    purchaseId: s.purchases[0].id,
    result: 'paid',
    amount: 995000,
  })
}
function shipped() {
  let s = paid()
  const p = s.purchases[0]
  const order = p.orders[0]
  s = act(
    s,
    {
      type: 'fulfill',
      purchaseId: p.id,
      orderId: order.id,
      next: 'processing',
    },
    'supplier-a',
  )
  return act(
    s,
    {
      type: 'fulfill',
      purchaseId: p.id,
      orderId: order.id,
      next: 'shipped',
      tracking: 'DEMO-001',
    },
    'supplier-a',
  )
}
describe('purchase domain — business acceptance', () => {
  it('D01 rejects quantity below MOQ and fractional quantities', () => {
    for (const quantity of [99, 100.5, -1, NaN])
      expect(() =>
        act(seedState(), { type: 'cart', productId: 'packing', quantity }),
      ).toThrow()
  })
  it('D02 applies whole-order price tiers at 500/501', () => {
    const p = seedState().products[0]
    expect(unitPrice(p, 500)).toBe(5500)
    expect(unitPrice(p, 501)).toBe(5000)
  })
  it('D03 carts do not reserve stock; both supplier charges are included', () => {
    expect(cartTotal(cart())).toBe(995000)
    expect(cart().products.every((p) => p.reserved === 0)).toBe(true)
  })
  it('D04 failed multi-supplier checkout does not partially reserve or create orders', () => {
    const s = cart()
    s.products[1].stock = 49
    const before = structuredClone(s)
    expect(() =>
      act(s, { type: 'checkout', expectedTotal: 995000, address }),
    ).toThrow('Stok berubah')
    expect(s).toEqual(before)
  })
  it('D05 requires renewed price consent and validates the address', () => {
    const s = cart()
    s.products[0].price = 5600
    expect(() =>
      act(s, { type: 'checkout', expectedTotal: 995000, address }),
    ).toThrow('Harga berubah')
    expect(() =>
      act(cart(), {
        type: 'checkout',
        expectedTotal: 995000,
        address: { ...address, phone: 'invalid' },
      }),
    ).toThrow('telepon')
  })
  it('D06 checkout reserves every item once and clears the cart', () => {
    const s = checkout()
    expect(s.products.map((p) => p.reserved)).toEqual([100, 50])
    expect(s.cart).toEqual({})
    expect(() =>
      act(s, { type: 'checkout', expectedTotal: 995000, address }),
    ).toThrow('kosong')
  })
  it('D07 order price/address snapshots remain immutable after catalog edits', () => {
    const s = checkout()
    s.products[0].price = 1
    const changed = { ...address, street: 'Alamat baru' }
    expect(s.purchases[0].address.street).not.toBe(changed.street)
    expect(s.purchases[0].orders[0].unitPrice).toBe(5500)
  })
  it('D08 duplicate paid events do not consume stock twice', () => {
    const s = paid()
    const twice = act(s, {
      type: 'payment',
      purchaseId: s.purchases[0].id,
      result: 'paid',
      amount: 995000,
    })
    expect(twice.products.map((p) => p.stock)).toEqual([4900, 1950])
    expect(twice.products.map((p) => p.reserved)).toEqual([0, 0])
  })
  it('D09 failed payment retry has a new reference and the same total', () => {
    let s = checkout()
    const p = s.purchases[0]
    s = act(s, { type: 'payment', purchaseId: p.id, result: 'failed' })
    s = act(s, { type: 'retry', purchaseId: p.id })
    expect(s.purchases[0].reference).not.toBe(p.reference)
    expect(s.purchases[0].total).toBe(p.total)
    expect(s.products[0].reserved).toBe(100)
  })
  it('D10 pending/review attempts cannot be retried', () => {
    let s = checkout()
    const p = s.purchases[0]
    expect(() => act(s, { type: 'retry', purchaseId: p.id })).toThrow()
    s = act(s, { type: 'payment', purchaseId: p.id, result: 'review' })
    expect(() => act(s, { type: 'retry', purchaseId: p.id })).toThrow()
  })
  it('D11 expiry releases reservations exactly once', () => {
    const s = checkout()
    const expired = expirePurchases(s, at + 86400000)
    expect(
      expirePurchases(expired, at + 86400001).products.map((p) => p.reserved),
    ).toEqual([0, 0])
    expect(expired.purchases[0].payment).toBe('expired')
  })
  it('D12 late/mismatched payments are held for review', () => {
    const s = checkout()
    const p = s.purchases[0]
    expect(
      execute(
        s,
        'buyer',
        { type: 'payment', purchaseId: p.id, result: 'paid', amount: p.total },
        at + 86400001,
      ).purchases[0].payment,
    ).toBe('review')
    expect(
      act(s, { type: 'payment', purchaseId: p.id, result: 'paid', amount: 1 })
        .purchases[0].payment,
    ).toBe('review')
  })
  it('D13 unpaid orders cannot be fulfilled', () => {
    const s = checkout()
    const p = s.purchases[0]
    expect(() =>
      act(
        s,
        {
          type: 'fulfill',
          purchaseId: p.id,
          orderId: p.orders[0].id,
          next: 'processing',
        },
        'supplier-a',
      ),
    ).toThrow('belum dibayar')
  })
  it('D14 supplier B cannot mutate supplier A orders', () => {
    const s = paid()
    const p = s.purchases[0]
    expect(() =>
      act(
        s,
        {
          type: 'fulfill',
          purchaseId: p.id,
          orderId: p.orders[0].id,
          next: 'processing',
        },
        'supplier-b',
      ),
    ).toThrow('miliknya')
  })
  it('D15 status transitions and tracking numbers are required', () => {
    let s = paid()
    const p = s.purchases[0]
    const base = {
      type: 'fulfill' as const,
      purchaseId: p.id,
      orderId: p.orders[0].id,
    }
    expect(() => act(s, { ...base, next: 'completed' })).toThrow(
      'belum dikirim',
    )
    expect(() =>
      act(s, { ...base, next: 'shipped', tracking: 'DEMO1' }, 'supplier-a'),
    ).toThrow('Urutan')
    s = act(s, { ...base, next: 'processing' }, 'supplier-a')
    expect(() =>
      act(s, { ...base, next: 'shipped', tracking: '' }, 'supplier-a'),
    ).toThrow('resi')
  })
  it('D16 explicit buyer receipt completes only its supplier suborder', () => {
    const s = shipped()
    const p = s.purchases[0]
    const received = act(s, {
      type: 'fulfill',
      purchaseId: p.id,
      orderId: p.orders[0].id,
      next: 'completed',
    })
    expect(received.purchases[0].orders.map((o) => o.status)).toEqual([
      'completed',
      'ready',
    ])
    expect(purchaseStatus(received.purchases[0])).toBe('Sebagian selesai')
  })
  it('D17 active issue blocks only the related supplier order', () => {
    let s = shipped()
    const p = s.purchases[0]
    s = act(s, {
      type: 'report',
      purchaseId: p.id,
      orderId: p.orders[0].id,
      message: 'Jumlah barang kurang lima.',
    })
    expect(() =>
      act(s, {
        type: 'fulfill',
        purchaseId: p.id,
        orderId: p.orders[0].id,
        next: 'completed',
      }),
    ).toThrow('Laporan aktif')
    expect(
      act(
        s,
        {
          type: 'fulfill',
          purchaseId: p.id,
          orderId: p.orders[1].id,
          next: 'processing',
        },
        'supplier-b',
      ).purchases[0].orders[1].status,
    ).toBe('processing')
  })
  it('D18 resolving a report does not complete/refund the order', () => {
    let s = shipped()
    const p = s.purchases[0]
    s = act(s, {
      type: 'report',
      purchaseId: p.id,
      orderId: p.orders[0].id,
      message: 'Jumlah barang kurang lima.',
    })
    s = act(
      s,
      {
        type: 'resolve',
        purchaseId: p.id,
        orderId: p.orders[0].id,
        note: 'Barang ditemukan dalam kemasan kedua.',
      },
      'admin',
    )
    expect(s.purchases[0].payment).toBe('paid')
    expect(s.purchases[0].orders[0].status).toBe('shipped')
  })
  it('D19 supplier payloads exclude the other supplier and cart', () => {
    const s = visibleState(paid(), 'supplier-a')
    expect(s.purchases[0].orders).toHaveLength(1)
    expect(s.purchases[0].total).toBe(575000)
    expect(s.products.map((p) => p.supplierId)).toEqual(['supplier-a'])
    expect(s.cart).toEqual({})
  })
  it('D20 both receipts produce a fully completed purchase', () => {
    let s = paid()
    const p = s.purchases[0]
    for (const o of p.orders) {
      s = act(
        s,
        {
          type: 'fulfill',
          purchaseId: p.id,
          orderId: o.id,
          next: 'processing',
        },
        o.supplierId as Persona,
      )
      s = act(
        s,
        {
          type: 'fulfill',
          purchaseId: p.id,
          orderId: o.id,
          next: 'shipped',
          tracking: 'DEMO-TRACK',
        },
        o.supplierId as Persona,
      )
      s = act(s, {
        type: 'fulfill',
        purchaseId: p.id,
        orderId: o.id,
        next: 'completed',
      })
    }
    expect(purchaseStatus(s.purchases[0])).toBe('Semua selesai')
  })
})

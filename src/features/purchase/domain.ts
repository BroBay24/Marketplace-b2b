/** Pure rules for the portfolio demo. Money is integer IDR; no real payments. */
export type Persona = 'buyer' | 'supplier-a' | 'supplier-b' | 'admin'
export type PaymentStatus = 'pending' | 'failed' | 'expired' | 'review' | 'paid'
export type Fulfillment = 'ready' | 'processing' | 'shipped' | 'completed'
export interface CatalogProduct {
  id: string
  supplierId: string
  supplier: string
  name: string
  sku: string
  moq: number
  stock: number
  reserved: number
  price: number
  tiers: Array<{ from: number; price: number }>
}
export interface Address {
  recipient: string
  phone: string
  street: string
  city: string
}
export interface Suborder {
  id: string
  supplierId: string
  supplier: string
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  shipping: number
  total: number
  status: Fulfillment
  tracking: string
  issue: string | null
  timeline: Array<{ label: string; at: number }>
}
export interface Purchase {
  id: string
  createdAt: number
  expiresAt: number
  total: number
  address: Address
  payment: PaymentStatus
  attempt: number
  reference: string
  reserved: boolean
  orders: Suborder[]
}
export interface DemoState {
  products: CatalogProduct[]
  cart: Record<string, number>
  purchases: Purchase[]
  nextId: number
  revision: number
  audit: Array<{ actor: Persona; action: string; at: number }>
}
export type Command =
  | { type: 'cart'; productId: string; quantity: number }
  | { type: 'checkout'; expectedTotal: number; address: Address }
  | {
      type: 'payment'
      purchaseId: string
      result: PaymentStatus
      amount?: number
    }
  | { type: 'retry'; purchaseId: string }
  | {
      type: 'fulfill'
      purchaseId: string
      orderId: string
      next: Fulfillment
      tracking?: string
    }
  | { type: 'report'; purchaseId: string; orderId: string; message: string }
  | { type: 'resolve'; purchaseId: string; orderId: string; note: string }

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}
function requireRule(ok: unknown, code: string, message: string): asserts ok {
  if (!ok) throw new DomainError(code, message)
}
export function seedState(): DemoState {
  return {
    products: [
      {
        id: 'packing',
        supplierId: 'supplier-a',
        supplier: 'PT Sumber Kemasan Jaya',
        name: 'Kardus Packing 30×20×15 cm',
        sku: 'KRD302015',
        moq: 100,
        stock: 5000,
        reserved: 0,
        price: 5500,
        tiers: [{ from: 501, price: 5000 }],
      },
      {
        id: 'large',
        supplierId: 'supplier-b',
        supplier: 'PT Kemasan Nusantara',
        name: 'Kardus Kirim 40×30×20 cm',
        sku: 'KRDBESAR',
        moq: 50,
        stock: 2000,
        reserved: 0,
        price: 8000,
        tiers: [],
      },
    ],
    cart: {},
    purchases: [],
    nextId: 1,
    revision: 0,
    audit: [],
  }
}
export function unitPrice(product: CatalogProduct, quantity: number) {
  return (
    [...product.tiers]
      .sort((a, b) => b.from - a.from)
      .find((t) => quantity >= t.from)?.price ?? product.price
  )
}
export function cartLines(state: DemoState) {
  return Object.entries(state.cart).map(([id, quantity]) => {
    const product = state.products.find((p) => p.id === id)
    requireRule(product, 'NOT_FOUND', 'Produk tidak ditemukan.')
    const price = unitPrice(product, quantity)
    const shipping = product.supplierId === 'supplier-a' ? 25000 : 20000
    return {
      product,
      quantity,
      price,
      shipping,
      subtotal: price * quantity,
      total: price * quantity + shipping,
    }
  })
}
export function cartTotal(state: DemoState) {
  return cartLines(state).reduce((n, row) => n + row.total, 0)
}
function release(state: DemoState, purchase: Purchase) {
  if (!purchase.reserved) return
  for (const order of purchase.orders) {
    const product = state.products.find((p) => p.id === order.productId)!
    product.reserved -= order.quantity
  }
  purchase.reserved = false
}
export function expirePurchases(source: DemoState, now: number): DemoState {
  const state = structuredClone(source)
  for (const p of state.purchases)
    if (['pending', 'failed'].includes(p.payment) && now >= p.expiresAt) {
      p.payment = 'expired'
      release(state, p)
      state.revision++
    }
  return state
}
/** Always returns a new state. A failed command leaves its input untouched. */
export function execute(
  source: DemoState,
  actor: Persona,
  command: Command,
  now = Date.now(),
): DemoState {
  const state = expirePurchases(source, now)
  if (command.type === 'cart') {
    requireRule(
      actor === 'buyer',
      'FORBIDDEN',
      'Hanya Buyer dapat mengubah keranjang.',
    )
    const product = state.products.find((p) => p.id === command.productId)
    requireRule(product, 'NOT_FOUND', 'Produk tidak ditemukan.')
    requireRule(
      Number.isSafeInteger(command.quantity) && command.quantity >= 0,
      'QUANTITY',
      'Jumlah harus berupa bilangan bulat.',
    )
    if (command.quantity === 0) delete state.cart[product.id]
    else {
      requireRule(
        command.quantity >= product.moq,
        'MOQ',
        `Minimum pembelian ${product.moq} pcs.`,
      )
      requireRule(
        command.quantity <= product.stock - product.reserved,
        'STOCK',
        'Stok tidak mencukupi.',
      )
      state.cart[product.id] = command.quantity
    }
  } else if (command.type === 'checkout') {
    requireRule(
      actor === 'buyer',
      'FORBIDDEN',
      'Hanya Buyer dapat membuat pesanan.',
    )
    const rows = cartLines(state)
    requireRule(rows.length > 0, 'EMPTY_CART', 'Keranjang masih kosong.')
    requireRule(
      !state.purchases.some((p) =>
        ['pending', 'failed', 'review'].includes(p.payment),
      ),
      'OPEN_PAYMENT',
      'Selesaikan instruksi pembayaran yang sudah ada.',
    )
    requireRule(
      Object.values(command.address).every((v) => v.trim().length >= 3),
      'ADDRESS',
      'Lengkapi alamat dan kontak penerima.',
    )
    requireRule(
      /^\+?[0-9\s-]{8,16}$/.test(command.address.phone),
      'PHONE',
      'Nomor telepon penerima tidak valid.',
    )
    for (const { product, quantity } of rows) {
      requireRule(
        Number.isSafeInteger(quantity) && quantity >= product.moq,
        'MOQ',
        'Jumlah belum memenuhi MOQ.',
      )
      requireRule(
        quantity <= product.stock - product.reserved,
        'STOCK',
        'Stok berubah. Tinjau keranjang kembali.',
      )
    }
    const total = cartTotal(state)
    requireRule(
      command.expectedTotal === total,
      'PRICE_CHANGED',
      'Harga berubah. Tinjau total terbaru sebelum menyetujui kembali.',
    )
    const id = `CHK-DEMO-${String(state.nextId++).padStart(4, '0')}`
    const purchase: Purchase = {
      id,
      createdAt: now,
      expiresAt: now + 86400000,
      total,
      address: structuredClone(command.address),
      payment: 'pending',
      attempt: 1,
      reference: `${id}-PAY-1`,
      reserved: true,
      orders: rows.map(
        ({ product, quantity, price, subtotal, shipping, total: sum }, i) => ({
          id: `${id}-${i + 1}`,
          supplierId: product.supplierId,
          supplier: product.supplier,
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice: price,
          subtotal,
          shipping,
          total: sum,
          status: 'ready',
          tracking: '',
          issue: null,
          timeline: [{ label: 'Pesanan dibuat', at: now }],
        }),
      ),
    }
    for (const row of rows) row.product.reserved += row.quantity
    state.purchases.unshift(purchase)
    state.cart = {}
  } else {
    const purchase = state.purchases.find((p) => p.id === command.purchaseId)
    requireRule(
      purchase,
      'NOT_FOUND',
      'Transaksi tidak ditemukan dalam sesi demo ini.',
    )
    if (command.type === 'payment') {
      // Payment outcomes are explicitly simulator controls in this portfolio build.
      requireRule(
        actor === 'buyer',
        'FORBIDDEN',
        'Simulasi pembayaran tersedia pada workspace Buyer.',
      )
      requireRule(
        command.result !== 'pending',
        'PAYMENT_STATE',
        'Gunakan instruksi pembayaran yang tersedia.',
      )
      if (purchase.payment === 'paid' && command.result === 'paid') return state
      requireRule(
        !['paid', 'review'].includes(purchase.payment),
        'PAYMENT_STATE',
        'Status pembayaran ini tidak dapat diubah oleh simulator.',
      )
      if (command.result === 'paid') {
        if (
          now >= purchase.expiresAt ||
          command.amount !== purchase.total ||
          purchase.payment === 'expired'
        ) {
          purchase.payment = 'review'
        } else {
          requireRule(
            purchase.payment === 'pending' && purchase.reserved,
            'PAYMENT_STATE',
            'Percobaan pembayaran tidak aktif.',
          )
          for (const order of purchase.orders) {
            state.products.find((p) => p.id === order.productId)!.stock -=
              order.quantity
            order.timeline.push({ label: 'Pembayaran diverifikasi', at: now })
          }
          release(state, purchase)
          purchase.payment = 'paid'
        }
      } else {
        requireRule(
          ['pending', 'failed'].includes(purchase.payment),
          'PAYMENT_STATE',
          'Percobaan pembayaran sudah berakhir.',
        )
        purchase.payment = command.result
        if (command.result === 'expired') release(state, purchase)
      }
    } else if (command.type === 'retry') {
      requireRule(
        actor === 'buyer',
        'FORBIDDEN',
        'Hanya Buyer dapat mencoba pembayaran ulang.',
      )
      requireRule(
        purchase.payment === 'failed' && now < purchase.expiresAt,
        'PAYMENT_STATE',
        'Pembayaran ulang hanya setelah gagal dan sebelum tenggat.',
      )
      purchase.attempt++
      purchase.reference = `${purchase.id}-PAY-${purchase.attempt}`
      purchase.payment = 'pending'
    } else {
      const order = purchase.orders.find((o) => o.id === command.orderId)
      requireRule(order, 'NOT_FOUND', 'Subpesanan tidak ditemukan.')
      if (command.type === 'fulfill') {
        requireRule(
          purchase.payment === 'paid',
          'UNPAID',
          'Pesanan belum dibayar.',
        )
        requireRule(
          !order.issue,
          'ISSUE_OPEN',
          'Laporan aktif harus ditangani terlebih dahulu.',
        )
        if (command.next === 'completed') {
          requireRule(
            actor === 'buyer',
            'FORBIDDEN',
            'Hanya Buyer dapat mengonfirmasi penerimaan.',
          )
          requireRule(
            order.status === 'shipped',
            'ORDER_STATE',
            'Barang belum dikirim.',
          )
          order.status = 'completed'
          order.timeline.push({ label: 'Diterima Buyer', at: now })
        } else {
          requireRule(
            actor === order.supplierId,
            'FORBIDDEN',
            'Supplier hanya dapat memproses pesanan miliknya.',
          )
          requireRule(
            (order.status === 'ready' && command.next === 'processing') ||
              (order.status === 'processing' && command.next === 'shipped'),
            'ORDER_STATE',
            'Urutan status pesanan tidak valid.',
          )
          if (command.next === 'shipped') {
            requireRule(
              command.tracking && command.tracking.trim().length >= 5,
              'TRACKING',
              'Masukkan nomor resi minimal 5 karakter.',
            )
            order.tracking = command.tracking.trim()
          }
          order.status = command.next
          order.timeline.push({
            label:
              command.next === 'processing'
                ? 'Sedang dikemas'
                : 'Diserahkan ke kurir',
            at: now,
          })
        }
      } else if (command.type === 'report') {
        requireRule(
          actor === 'buyer',
          'FORBIDDEN',
          'Hanya Buyer dapat melaporkan penerimaan.',
        )
        requireRule(
          order.status === 'shipped' && !order.issue,
          'ORDER_STATE',
          'Laporan hanya untuk pengiriman aktif.',
        )
        requireRule(
          command.message.trim().length >= 10,
          'REPORT',
          'Jelaskan masalah minimal 10 karakter.',
        )
        order.issue = command.message.trim()
        order.timeline.push({ label: 'Laporan Buyer dibuka', at: now })
      } else {
        requireRule(
          actor === 'admin',
          'FORBIDDEN',
          'Hanya Admin dapat mencatat penanganan.',
        )
        requireRule(
          order.issue && command.note.trim().length >= 10,
          'REPORT',
          'Isi catatan penanganan minimal 10 karakter.',
        )
        order.issue = null
        order.timeline.push({
          label: `Laporan ditangani: ${command.note.trim()}`,
          at: now,
        })
      }
    }
  }
  state.revision++
  state.audit.push({ actor, action: command.type, at: now })
  return state
}
export function purchaseStatus(p: Purchase) {
  if (p.payment !== 'paid')
    return {
      pending: 'Menunggu pembayaran',
      failed: 'Pembayaran gagal',
      expired: 'Kedaluwarsa',
      review: 'Dalam pemeriksaan',
    }[p.payment]
  if (p.orders.every((o) => o.status === 'completed')) return 'Semua selesai'
  if (p.orders.some((o) => o.status === 'completed')) return 'Sebagian selesai'
  return 'Pembayaran berhasil'
}
export function visibleState(state: DemoState, actor: Persona): DemoState {
  const result = structuredClone(state)
  if (actor.startsWith('supplier-')) {
    result.products = result.products.filter((p) => p.supplierId === actor)
    result.cart = {}
    result.purchases = result.purchases
      .filter((p) => p.payment === 'paid')
      .map((p) => {
        p.orders = p.orders.filter((o) => o.supplierId === actor)
        p.total = p.orders.reduce((sum, o) => sum + o.total, 0)
        return p
      })
      .filter((p) => p.orders.length > 0)
    result.audit = result.audit.filter((a) => a.actor === actor)
  } else if (actor !== 'admin') result.audit = []
  return result
}

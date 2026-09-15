import { useEffect, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Dialog } from 'radix-ui'
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Moon,
  Package,
  Plus,
  ShoppingCart,
  Sun,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { cartLines, cartTotal, purchaseStatus, unitPrice } from './domain'
import type {
  Address,
  Command,
  DemoState,
  Persona,
  Purchase,
  Suborder,
} from './domain'
import { runDemoCommand, startDemo } from './demo.functions'
import './purchase.css'

const money = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
const date = (n: number) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(n)
const personas: Record<Persona, string> = {
  buyer: 'Buyer · PT Maju Bersama',
  'supplier-a': 'Supplier A · Sumber Kemasan Jaya',
  'supplier-b': 'Supplier B · Kemasan Nusantara',
  admin: 'Admin · Operasional',
}
const statusText = {
  ready: 'Siap diproses',
  processing: 'Sedang dikemas',
  shipped: 'Dikirim',
  completed: 'Selesai',
}
type Snapshot = { actor: Persona; state: DemoState } | null
type Modal =
  | {
      kind: 'receive' | 'ship' | 'report' | 'resolve'
      purchase: Purchase
      order: Suborder
    }
  | { kind: 'reset' }

export function PurchaseDemo({ initial }: { initial: Snapshot }) {
  const router = useRouter()
  const enter = useServerFn(startDemo)
  const mutate = useServerFn(runDemoCommand)
  const [tab, setTab] = useState<'catalog' | 'cart' | 'checkout' | 'orders'>(
    'catalog',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [dark, setDark] = useState(false)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<Modal | null>(null)
  const [address, setAddress] = useState<Address>({
    recipient: 'Andi Pratama',
    phone: '081234567890',
    street: 'Jl. Raya Rungkut No. 12',
    city: 'Surabaya',
  })
  const [selectedPersona, setSelectedPersona] = useState<Persona>('buyer')
  useEffect(() => {
    setDark(localStorage.getItem('b2b-theme') === 'dark')
  }, [])
  useEffect(() => {
    if (initial) setSelectedPersona(initial.actor)
  }, [initial?.actor])

  async function run(command: Command, success = 'Perubahan tersimpan.') {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await mutate({
        data: { requestId: crypto.randomUUID(), command },
      })
      await router.invalidate({ sync: true })
      if (result.error) {
        setError(result.error.message)
        return false
      }
      setMessage(success)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Koneksi gagal. Coba kembali.')
      return false
    } finally {
      setBusy(false)
    }
  }
  async function switchPersona(actor: Persona, reset = false) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await enter({ data: { actor, reset } })
      await router.invalidate({ sync: true })
      setTab(actor === 'buyer' && reset ? 'catalog' : 'orders')
      setModal(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sesi belum dapat dibuka.')
    } finally {
      setBusy(false)
    }
  }
  const state = initial?.state
  const actor = initial?.actor ?? 'buyer'
  const buyer = actor === 'buyer'
  const rows = state ? cartLines(state) : []
  const total = state ? cartTotal(state) : 0
  const currentTab = buyer ? tab : 'orders'
  function theme() {
    setDark(!dark)
    localStorage.setItem('b2b-theme', dark ? 'light' : 'dark')
  }
  const alert = (
    <>
      {error && (
        <div role="alert" className="purchase-notice danger">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="purchase-notice success">
          {message}
        </div>
      )}
    </>
  )

  return (
    <div className={`purchase-app ${dark ? 'dark' : ''}`}>
      <header className="purchase-header">
        <Link to="/" className="purchase-brand">
          <Package size={24} /> Marketplace B2B
        </Link>
        <div className="purchase-header-actions">
          <span className="purchase-demo-tag">PORTOFOLIO · DEMO</span>
          <Button
            variant="outline"
            size="icon"
            aria-label={dark ? 'Gunakan Light Mode' : 'Gunakan Dark Mode'}
            onClick={theme}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>
      {!state ? (
        <main className="purchase-welcome">
          <p className="eyebrow">PENGADAAN KEMASAN</p>
          <h1>
            Pesan dengan jelas.
            <br />
            Terima dengan pasti.
          </h1>
          <p>
            Jelajahi harga grosir, beli dari dua supplier, dan ikuti pesanan
            sampai barang diterima.
          </p>
          <Card className="purchase-card">
            <h2>Mulai skenario pembelian</h2>
            <p>
              Gunakan data fiktif. Pembayaran disimulasikan; tidak ada uang yang
              ditransfer.
            </p>
            <Button
              disabled={busy}
              onClick={() => switchPersona('buyer', true)}
            >
              {busy ? 'Membuka demo…' : 'Mulai demo sebagai Buyer'}
            </Button>
          </Card>
          {alert}
          <p className="muted">
            Sesi demo terpisah per browser dan berlaku 24 jam. Data demo direset
            saat server dimulai ulang.
          </p>
        </main>
      ) : (
        <div className={`purchase-layout ${buyer ? 'buyer' : 'workspace'}`}>
          <aside className="purchase-sidebar">
            <p className="eyebrow">PANDUAN AKUN DEMO</p>
            <label htmlFor="persona">Lanjutkan sebagai</label>
            <select
              id="persona"
              disabled={busy}
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as Persona)}
            >
              {Object.entries(personas).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={busy || selectedPersona === actor}
              onClick={() => switchPersona(selectedPersona)}
            >
              Buka workspace
            </Button>
            <p className="muted">
              Pergantian akun hanya untuk demonstrasi lintas role.
            </p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setModal({ kind: 'reset' })}
            >
              Mulai ulang demo
            </Button>
            <div className="purchase-notice">
              <strong>Urutan skenario</strong>
              <ol>
                <li>Buyer membuat dan membayar pesanan.</li>
                <li>Masing-masing Supplier mengemas dan mengirim.</li>
                <li>Buyer memeriksa dan menerima barang.</li>
              </ol>
            </div>
          </aside>
          <main className="purchase-main" aria-busy={busy}>
            <div className="purchase-heading">
              <p className="eyebrow">{personas[actor]}</p>
              <h1>
                {currentTab === 'catalog'
                  ? 'Kebutuhan bisnis Anda'
                  : currentTab === 'cart'
                    ? 'Keranjang pengadaan'
                    : currentTab === 'checkout'
                      ? 'Tinjau checkout'
                      : actor === 'admin'
                        ? 'Laporan & audit'
                        : 'Pesanan Anda'}
              </h1>
            </div>
            {alert}
            {currentTab === 'catalog' && (
              <>
                <div className="purchase-hero">
                  <p className="eyebrow">HARGA GROSIR TRANSPARAN</p>
                  <h2>
                    Kemasan siap.
                    <br />
                    Bisnis terus berjalan.
                  </h2>
                  <p>MOQ, stok, dan ongkir jelas sebelum Anda membeli.</p>
                </div>
                <label className="sr-only" htmlFor="product-search">
                  Cari produk
                </label>
                <Input
                  id="product-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama produk atau SKU"
                />
                <div className="purchase-products">
                  {state.products
                    .filter((p) =>
                      `${p.name} ${p.sku}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((p) => (
                      <Card key={p.id} className="purchase-card product-card">
                        <img
                          className="product-art"
                          src="/design/packing-box.svg"
                          alt={`Ilustrasi ${p.name}`}
                          width="180"
                          height="160"
                        />
                        <span className="status-chip">
                          <Check size={14} /> Supplier terverifikasi
                        </span>
                        <h2>{p.name}</h2>
                        <p className="muted">{p.supplier}</p>
                        <p className="price">
                          {money(p.price)} <span>/ pcs</span>
                        </p>
                        <p>MOQ {p.moq} pcs · Kelipatan 1</p>
                        <p className="stock">
                          Stok tersedia{' '}
                          {(p.stock - p.reserved).toLocaleString('id-ID')} pcs
                        </p>
                        {p.tiers.length > 0 && (
                          <p className="muted">
                            Mulai 501 pcs: {money(unitPrice(p, 501))}/pcs untuk
                            seluruh unit.
                          </p>
                        )}
                        <Button
                          disabled={busy || p.stock - p.reserved < p.moq}
                          onClick={() =>
                            run(
                              {
                                type: 'cart',
                                productId: p.id,
                                quantity: state.cart[p.id] ?? p.moq,
                              },
                              `${p.name} tersedia di keranjang.`,
                            )
                          }
                        >
                          <Plus />{' '}
                          {state.cart[p.id]
                            ? 'Sudah di keranjang'
                            : `Tambah ${p.moq} pcs`}
                        </Button>
                      </Card>
                    ))}
                </div>
                {!state.products.some((p) =>
                  `${p.name} ${p.sku}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                ) && (
                  <Empty
                    title="Produk tidak ditemukan"
                    text="Gunakan nama produk atau SKU yang berbeda."
                  />
                )}
              </>
            )}
            {(currentTab === 'cart' || currentTab === 'checkout') && (
              <>
                <div className="purchase-steps">
                  <span>1 · Keranjang</span>
                  <span className={currentTab === 'checkout' ? 'active' : ''}>
                    2 · Checkout
                  </span>
                  <span>3 · Pembayaran</span>
                </div>
                {!rows.length ? (
                  <Empty
                    title="Keranjang masih kosong"
                    text="Tambahkan kebutuhan kemasan dari katalog."
                    action={
                      <Button onClick={() => setTab('catalog')}>
                        Buka katalog
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {currentTab === 'checkout' && (
                      <Card className="purchase-card">
                        <h2>Alamat penerimaan</h2>
                        <div className="address-grid">
                          {(
                            [
                              ['recipient', 'Nama penerima'],
                              ['phone', 'Nomor telepon'],
                              ['street', 'Alamat lengkap'],
                              ['city', 'Kota'],
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key}>
                              {label}
                              <Input
                                value={address[key]}
                                onChange={(e) =>
                                  setAddress({
                                    ...address,
                                    [key]: e.target.value,
                                  })
                                }
                                required
                                autoComplete={
                                  key === 'phone'
                                    ? 'tel'
                                    : key === 'street'
                                      ? 'street-address'
                                      : key === 'city'
                                        ? 'address-level2'
                                        : 'name'
                                }
                              />
                            </label>
                          ))}
                        </div>
                        <p className="muted">
                          Alamat disimpan bersama pesanan dan tidak berubah saat
                          profil diedit.
                        </p>
                      </Card>
                    )}
                    {rows.map((row) => (
                      <Card key={row.product.id} className="purchase-card">
                        <p className="stock">✓ {row.product.supplier}</p>
                        <div className="purchase-item">
                          <img
                            src="/design/packing-box.svg"
                            width="88"
                            height="88"
                            alt=""
                          />
                          <div>
                            <h2>{row.product.name}</h2>
                            <p className="price">{money(row.price)} / pcs</p>
                            <p className="muted">
                              Min. {row.product.moq} pcs · Kelipatan 1
                            </p>
                          </div>
                        </div>
                        {currentTab === 'cart' ? (
                          <QuantityEditor
                            productId={row.product.id}
                            minimum={row.product.moq}
                            quantity={row.quantity}
                            busy={busy}
                            onSave={(q) =>
                              run({
                                type: 'cart',
                                productId: row.product.id,
                                quantity: q,
                              })
                            }
                          />
                        ) : (
                          <p>{row.quantity.toLocaleString('id-ID')} pcs</p>
                        )}
                        <dl className="money-lines">
                          <div>
                            <dt>Subtotal</dt>
                            <dd>{money(row.subtotal)}</dd>
                          </div>
                          <div>
                            <dt>Pengiriman reguler</dt>
                            <dd>{money(row.shipping)}</dd>
                          </div>
                        </dl>
                      </Card>
                    ))}
                    <div className="purchase-notice">
                      {currentTab === 'cart'
                        ? 'Stok belum dicadangkan. Harga dan stok diperiksa kembali saat checkout.'
                        : 'Pembayaran di muka · Simulasi. Pajak dan biaya layanan Rp0. Pengiriman diproses terpisah oleh tiap supplier.'}
                    </div>
                    <div className="purchase-sticky">
                      <div>
                        <span>Total pembayaran</span>
                        <strong data-testid="cart-total">{money(total)}</strong>
                      </div>
                      <Button
                        disabled={busy}
                        onClick={async () => {
                          if (currentTab === 'cart') setTab('checkout')
                          else if (
                            await run(
                              {
                                type: 'checkout',
                                expectedTotal: total,
                                address,
                              },
                              'Pesanan dibuat. Gunakan instruksi pembayaran yang tersedia.',
                            )
                          )
                            setTab('orders')
                        }}
                      >
                        {busy
                          ? 'Memproses…'
                          : currentTab === 'cart'
                            ? 'Lanjut checkout'
                            : 'Buat pesanan'}
                      </Button>
                      {currentTab === 'checkout' && (
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => setTab('cart')}
                        >
                          <ArrowLeft /> Tinjau keranjang
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            {currentTab === 'orders' && (
              <>
                {!state.purchases.length && (
                  <Empty
                    title={
                      buyer ? 'Belum ada pesanan' : 'Belum ada pesanan dibayar'
                    }
                    text={
                      buyer
                        ? 'Mulai pembelian dari katalog.'
                        : 'Selesaikan pembayaran pada workspace Buyer terlebih dahulu.'
                    }
                  />
                )}
                {state.purchases.map((p) => (
                  <section
                    key={p.id}
                    className="purchase-order"
                    data-testid="purchase"
                  >
                    <Card className="purchase-card">
                      <div className="purchase-order-title">
                        <div>
                          <p className="eyebrow">{p.id}</p>
                          <h2>{purchaseStatus(p)}</h2>
                        </div>
                        <strong className="price">{money(p.total)}</strong>
                      </div>
                      <p className="muted">
                        {date(p.createdAt)} WIB · {p.orders.length} supplier
                      </p>
                      {buyer && ['pending', 'failed'].includes(p.payment) && (
                        <div className="purchase-notice">
                          <strong>{p.reference}</strong>
                          <p>Tenggat: {date(p.expiresAt)} WIB</p>
                          <p>
                            Gunakan instruksi ini. Jangan membuat pembayaran
                            kedua saat status belum pasti.
                          </p>
                        </div>
                      )}
                      {buyer && p.payment === 'pending' && (
                        <div className="simulation-controls">
                          <p className="eyebrow">
                            SIMULATOR PEMBAYARAN · TANPA TRANSFER UANG
                          </p>
                          <Button
                            disabled={busy}
                            onClick={() =>
                              run(
                                {
                                  type: 'payment',
                                  purchaseId: p.id,
                                  result: 'paid',
                                  amount: p.total,
                                },
                                'Pembayaran simulasi berhasil diverifikasi.',
                              )
                            }
                          >
                            Simulasikan pembayaran berhasil
                          </Button>
                          <div className="button-row">
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                run({
                                  type: 'payment',
                                  purchaseId: p.id,
                                  result: 'failed',
                                })
                              }
                            >
                              Gagal
                            </Button>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                run({
                                  type: 'payment',
                                  purchaseId: p.id,
                                  result: 'expired',
                                })
                              }
                            >
                              Kedaluwarsa
                            </Button>
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                run({
                                  type: 'payment',
                                  purchaseId: p.id,
                                  result: 'review',
                                })
                              }
                            >
                              Perlu pemeriksaan
                            </Button>
                          </div>
                        </div>
                      )}
                      {buyer && p.payment === 'failed' && (
                        <Button
                          disabled={busy}
                          onClick={() =>
                            run(
                              { type: 'retry', purchaseId: p.id },
                              'Instruksi baru dibuat. Referensi sebelumnya sudah berakhir.',
                            )
                          }
                        >
                          Coba pembayaran lagi
                        </Button>
                      )}
                      {p.payment === 'review' && (
                        <div className="purchase-notice warning">
                          Jangan membayar ulang. Pesanan belum dapat diproses.
                          Penyelesaian pembayaran perlu pemeriksaan berada di
                          luar alur pembelian v1.
                        </div>
                      )}
                      {p.payment === 'expired' && (
                        <div className="purchase-notice warning">
                          Pesanan belum dibayar dibatalkan. Reservasi stok telah
                          dilepas.
                        </div>
                      )}
                      <details>
                        <summary>Alamat saat checkout</summary>
                        <p>
                          {p.address.recipient} · {p.address.phone}
                        </p>
                        <p>
                          {p.address.street}, {p.address.city}
                        </p>
                      </details>
                    </Card>
                    {p.orders.map((o) => (
                      <Card
                        key={o.id}
                        className="purchase-card"
                        data-testid={`order-${o.supplierId}`}
                      >
                        <div className="purchase-order-title">
                          <h2>{o.supplier}</h2>
                          <span className="status-chip">
                            {p.payment === 'paid'
                              ? statusText[o.status]
                              : 'Menunggu pembayaran'}
                          </span>
                        </div>
                        <p>{o.name}</p>
                        <p className="muted">
                          {o.quantity.toLocaleString('id-ID')} pcs ×{' '}
                          {money(o.unitPrice)} · Ongkir {money(o.shipping)}
                        </p>
                        <strong className="price">{money(o.total)}</strong>
                        {o.tracking && (
                          <p>
                            <Truck size={18} className="inline" /> Resi:{' '}
                            <strong>{o.tracking}</strong>
                          </p>
                        )}
                        {o.issue && (
                          <div className="purchase-notice warning">
                            <strong>Laporan aktif</strong>
                            <p>{o.issue}</p>
                            <p>
                              Penerimaan subpesanan ini ditahan sampai laporan
                              ditangani.
                            </p>
                          </div>
                        )}
                        <ol className="purchase-timeline">
                          {o.timeline.map((e, i) => (
                            <li key={i}>
                              <span>{e.label}</span>
                              <time>{date(e.at)} WIB</time>
                            </li>
                          ))}
                        </ol>
                        {!buyer &&
                          actor === o.supplierId &&
                          p.payment === 'paid' &&
                          !o.issue &&
                          o.status === 'ready' && (
                            <Button
                              disabled={busy}
                              onClick={() =>
                                run({
                                  type: 'fulfill',
                                  purchaseId: p.id,
                                  orderId: o.id,
                                  next: 'processing',
                                })
                              }
                            >
                              Mulai pengemasan
                            </Button>
                          )}
                        {!buyer &&
                          actor === o.supplierId &&
                          p.payment === 'paid' &&
                          !o.issue &&
                          o.status === 'processing' && (
                            <Button
                              disabled={busy}
                              onClick={() =>
                                setModal({
                                  kind: 'ship',
                                  purchase: p,
                                  order: o,
                                })
                              }
                            >
                              Masukkan resi & kirim
                            </Button>
                          )}
                        {buyer &&
                          p.payment === 'paid' &&
                          !o.issue &&
                          o.status === 'shipped' && (
                            <>
                              <Button
                                disabled={busy}
                                onClick={() =>
                                  setModal({
                                    kind: 'receive',
                                    purchase: p,
                                    order: o,
                                  })
                                }
                              >
                                Periksa & terima barang
                              </Button>
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  setModal({
                                    kind: 'report',
                                    purchase: p,
                                    order: o,
                                  })
                                }
                              >
                                Laporkan masalah
                              </Button>
                            </>
                          )}
                        {actor === 'admin' && o.issue && (
                          <Button
                            disabled={busy}
                            onClick={() =>
                              setModal({
                                kind: 'resolve',
                                purchase: p,
                                order: o,
                              })
                            }
                          >
                            Catat penanganan laporan
                          </Button>
                        )}
                        {p.payment === 'paid' && (
                          <details>
                            <summary>Invoice demo · {o.id}</summary>
                            <dl className="money-lines">
                              <div>
                                <dt>Produk</dt>
                                <dd>{money(o.subtotal)}</dd>
                              </div>
                              <div>
                                <dt>Ongkir</dt>
                                <dd>{money(o.shipping)}</dd>
                              </div>
                              <div>
                                <dt>Total dibayar</dt>
                                <dd>{money(o.total)}</dd>
                              </div>
                            </dl>
                          </details>
                        )}
                      </Card>
                    ))}
                  </section>
                ))}
                {actor === 'admin' && (
                  <Card className="purchase-card">
                    <h2>Audit tindakan</h2>
                    <ol className="purchase-timeline">
                      {state.audit.map((e, i) => (
                        <li key={i}>
                          <span>
                            {personas[e.actor]} · {e.action}
                          </span>
                          <time>{date(e.at)} WIB</time>
                        </li>
                      ))}
                    </ol>
                  </Card>
                )}
              </>
            )}
          </main>
          {buyer && (
            <nav className="purchase-bottom" aria-label="Navigasi Buyer">
              {(
                [
                  ['catalog', 'Katalog', Package],
                  ['cart', `Keranjang (${rows.length})`, ShoppingCart],
                  ['orders', 'Pesanan', ClipboardList],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  aria-current={tab === id ? 'page' : undefined}
                  disabled={busy}
                  onClick={() => {
                    setTab(id)
                    setError('')
                    setMessage('')
                  }}
                >
                  <Icon size={24} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      )}
      {modal && (
        <ActionDialog
          modal={modal}
          dark={dark}
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={async (value) => {
            if (modal.kind === 'reset') {
              await switchPersona('buyer', true)
              return
            }
            const base = {
              purchaseId: modal.purchase.id,
              orderId: modal.order.id,
            }
            const command: Command =
              modal.kind === 'receive'
                ? { ...base, type: 'fulfill', next: 'completed' }
                : modal.kind === 'ship'
                  ? {
                      ...base,
                      type: 'fulfill',
                      next: 'shipped',
                      tracking: value,
                    }
                  : modal.kind === 'report'
                    ? { ...base, type: 'report', message: value }
                    : { ...base, type: 'resolve', note: value }
            if (await run(command)) setModal(null)
          }}
          error={error}
        />
      )}
    </div>
  )
}

function QuantityEditor({
  productId,
  minimum,
  quantity,
  busy,
  onSave,
}: {
  productId: string
  minimum: number
  quantity: number
  busy: boolean
  onSave: (q: number) => Promise<boolean>
}) {
  const [draft, setDraft] = useState(String(quantity))
  useEffect(() => setDraft(String(quantity)), [quantity])
  return (
    <form
      className="quantity-editor"
      onSubmit={(e) => {
        e.preventDefault()
        void onSave(Number(draft))
      }}
    >
      <label htmlFor={`qty-${productId}`}>Jumlah (pcs)</label>
      <div>
        <Input
          id={`qty-${productId}`}
          type="number"
          min={minimum}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          required
        />
        <Button variant="outline" disabled={busy} type="submit">
          Simpan jumlah
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Hapus ${productId} dari keranjang`}
          disabled={busy}
          onClick={() => onSave(0)}
        >
          <Trash2 />
        </Button>
      </div>
    </form>
  )
}
function Empty({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: React.ReactNode
}) {
  return (
    <Card className="purchase-card purchase-empty">
      <Package size={40} />
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </Card>
  )
}
function ActionDialog({
  dark,
  modal,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  modal: Modal
  dark: boolean
  busy: boolean
  error: string
  onClose: () => void
  onConfirm: (value: string) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const title = {
    receive: 'Konfirmasi penerimaan',
    ship: 'Kirim seluruh pesanan',
    report: 'Laporkan masalah',
    resolve: 'Catat penanganan',
    reset: 'Mulai ulang demo?',
  }[modal.kind]
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="purchase-dialog-overlay" />
        <Dialog.Content className={`purchase-dialog ${dark ? 'dark' : ''}`}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>
            {modal.kind === 'reset'
              ? 'Semua transaksi pada sesi demo ini akan dihapus dan stok kembali ke kondisi awal.'
              : modal.kind === 'receive'
                ? `Pastikan seluruh ${modal.order.quantity} pcs dari ${modal.order.supplier} lengkap dan sesuai. Konfirmasi hanya menyelesaikan subpesanan ini.`
                : 'Data akan disimpan pada timeline pesanan. Gunakan informasi fiktif untuk demonstrasi.'}
          </Dialog.Description>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void onConfirm(value)
            }}
          >
            {!['reset', 'receive'].includes(modal.kind) && (
              <label>
                {modal.kind === 'ship' ? 'Nomor resi demo' : 'Catatan'}
                <Input
                  autoFocus
                  required
                  minLength={modal.kind === 'ship' ? 5 : 10}
                  maxLength={modal.kind === 'ship' ? 100 : 1000}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
            )}
            {modal.kind === 'receive' && (
              <label className="confirmation">
                <input type="checkbox" required /> Saya sudah memeriksa jumlah
                dan kondisi barang.
              </label>
            )}
            {error && <p role="alert">{error}</p>}
            <div className="button-row">
              <Button
                variant="outline"
                disabled={busy}
                type="button"
                onClick={onClose}
              >
                Batal
              </Button>
              <Button disabled={busy} type="submit">
                {busy
                  ? 'Menyimpan…'
                  : modal.kind === 'receive'
                    ? 'Konfirmasi barang diterima'
                    : modal.kind === 'reset'
                      ? 'Ya, mulai ulang'
                      : 'Simpan & lanjutkan'}
              </Button>
            </div>
          </form>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="dialog-close"
              aria-label="Tutup dialog"
              disabled={busy}
            >
              <X />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

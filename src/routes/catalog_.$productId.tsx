import { useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  CatalogShell,
  CatalogState,
  formatQuantity,
} from '#/components/catalog/catalog-ui'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { catalogProductIdSchema } from '#/domain/catalog'
import type { CatalogProduct } from '#/domain/catalog'
import { calculateProductPrice } from '#/domain/product-rules'
import { formatRupiah } from '#/lib/format'
import { getCatalogProduct } from '#/server/catalog.functions'

export const Route = createFileRoute('/catalog_/$productId')({
  loader: async ({ params }) => {
    const input = catalogProductIdSchema.safeParse({ id: params.productId })
    if (!input.success) throw notFound()
    const product = await getCatalogProduct({ data: input.data })
    if (!product) throw notFound()
    return product
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? 'Detail produk'} | DistribuHub` }],
  }),
  pendingComponent: () => (
    <CatalogShell detail>
      <CatalogState
        title="Memuat produk…"
        description="Menyiapkan detail produk dan harga grosir."
        loading
      />
    </CatalogShell>
  ),
  errorComponent: ({ reset }) => (
    <CatalogShell detail>
      <CatalogState
        title="Produk belum dapat dimuat"
        description="Silakan coba lagi dalam beberapa saat."
        onRetry={reset}
      />
    </CatalogShell>
  ),
  notFoundComponent: () => (
    <CatalogShell detail>
      <CatalogState
        title="Produk tidak ditemukan"
        description="Produk ini mungkin sudah tidak tersedia di katalog."
      >
        <Button asChild className="catalog-button">
          <Link to="/catalog" search={{}}>
            Kembali ke katalog
          </Link>
        </Button>
      </CatalogState>
    </CatalogShell>
  ),
  component: ProductPage,
})

function ProductPage() {
  const product = Route.useLoaderData()
  const tiers = product.priceTiers.length
    ? product.priceTiers
    : [{ minQuantity: product.moq, unitPriceIdr: product.basePriceIdr }]

  return (
    <CatalogShell detail>
      <div className="catalog-detail-grid">
        <div className="catalog-detail-visual">
          {product.imageUrl ? (
            <img
              className="catalog-detail-image"
              src={
                product.imageUrl === '/images/catalog/box.svg'
                  ? '/images/catalog/box-detail.svg'
                  : product.imageUrl
              }
              width="744"
              height="472"
              alt={`Ilustrasi ${product.name}`}
            />
          ) : (
            <div className="catalog-detail-image catalog-image-empty">
              Foto belum tersedia
            </div>
          )}
          <Card className="catalog-supplier-card">
            <img
              src="/images/catalog/shield.svg"
              width="24"
              height="24"
              alt=""
            />
            <div>
              <h2>{product.supplier.name}</h2>
              <p>{product.supplier.city} · Supplier terverifikasi</p>
            </div>
          </Card>
        </div>

        <div className="catalog-detail-copy">
          <div className="catalog-trust-markers">
            <span className="catalog-trust-badge">✓ TERVERIFIKASI</span>
            <span className="catalog-trust-badge">
              ● Stok {formatQuantity(product.availableStock)} {product.unit}
            </span>
          </div>
          <h1>{product.name}</h1>
          <p className="catalog-product-meta">
            SKU {product.sku} · {product.category.name}
          </p>
          <Card className="catalog-tier-card">
            <h2>Harga grosir per {product.unit}</h2>
            <dl className="catalog-tiers">
              {tiers.map((tier, index) => (
                <div
                  key={tier.minQuantity}
                  className={
                    index === 0
                      ? 'catalog-tier catalog-tier-primary'
                      : 'catalog-tier'
                  }
                >
                  <dt>
                    {formatQuantity(tier.minQuantity)}
                    {tiers[index + 1]
                      ? `–${formatQuantity(tiers[index + 1].minQuantity - 1)}`
                      : '+'}{' '}
                    {product.unit}
                  </dt>
                  <dd>{formatRupiah(tier.unitPriceIdr)}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <p className="catalog-pricing-note">
            MOQ {formatQuantity(product.moq)} {product.unit} · Kelipatan{' '}
            {formatQuantity(product.quantityStep)}. Harga tingkat yang berlaku
            dihitung untuk seluruh unit produk.
          </p>
          <PriceEstimate key={product.id} product={product} />
          <Card className="catalog-description-card">
            <h2>Deskripsi produk</h2>
            <p>{product.description}</p>
          </Card>
        </div>
      </div>
    </CatalogShell>
  )
}

function PriceEstimate({ product }: { product: CatalogProduct }) {
  const [quantity, setQuantity] = useState(String(product.moq))
  const quantityNumber = Number(quantity)
  const error =
    !quantity.trim() || !Number.isSafeInteger(quantityNumber)
      ? 'Masukkan jumlah dalam bilangan bulat.'
      : quantityNumber < product.moq
        ? `Jumlah minimum ${formatQuantity(product.moq)} ${product.unit}.`
        : (quantityNumber - product.moq) % product.quantityStep !== 0
          ? `Gunakan kelipatan ${formatQuantity(product.quantityStep)} dari jumlah minimum.`
          : quantityNumber > product.availableStock
            ? `Stok tersedia ${formatQuantity(product.availableStock)} ${product.unit}.`
            : null
  let estimate: ReturnType<typeof calculateProductPrice> | null = null
  let pricingError: string | null = null
  if (!error) {
    try {
      estimate = calculateProductPrice(
        {
          minimumOrderQuantity: product.moq,
          quantityStep: product.quantityStep,
          basePriceIdr: product.basePriceIdr,
          priceTiers: product.priceTiers.map((tier) => ({
            minimumQuantity: tier.minQuantity,
            unitPriceIdr: tier.unitPriceIdr,
          })),
        },
        quantityNumber,
      )
    } catch {
      pricingError = 'Estimasi harga tidak dapat dihitung untuk jumlah ini.'
    }
  }
  const displayedError = error ?? pricingError

  return (
    <Card className="catalog-estimate-card">
      <h2>Hitung estimasi harga</h2>
      <label htmlFor="estimate-quantity">Jumlah ({product.unit})</label>
      <Input
        id="estimate-quantity"
        inputMode="numeric"
        type="number"
        min={product.moq}
        step={product.quantityStep}
        max={product.availableStock}
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        className="catalog-quantity-input"
        aria-invalid={Boolean(displayedError)}
        aria-describedby={displayedError ? 'estimate-error' : 'estimate-note'}
      />
      {displayedError ? (
        <p id="estimate-error" className="catalog-field-error" role="status">
          {displayedError}
        </p>
      ) : estimate ? (
        <div className="catalog-estimate-result" aria-live="polite">
          <span>
            {formatRupiah(estimate.unitPriceIdr)} ×{' '}
            {formatQuantity(estimate.quantity)}
          </span>
          <strong>{formatRupiah(estimate.subtotalIdr)}</strong>
        </div>
      ) : null}
      <p id="estimate-note" className="catalog-product-meta">
        Estimasi subtotal produk, belum termasuk ongkir.
      </p>
    </Card>
  )
}

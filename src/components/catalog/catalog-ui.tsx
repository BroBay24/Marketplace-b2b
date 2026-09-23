import { useEffect, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { CatalogProduct } from '#/domain/catalog'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { formatRupiah } from '#/lib/format'

const themeStorageKey = 'distribuhub-catalog-theme'
const numberFormatter = new Intl.NumberFormat('id-ID')
export const formatQuantity = (value: number) => numberFormatter.format(value)

export function CatalogShell({
  children,
  detail = false,
}: {
  children: ReactNode
  detail?: boolean
}) {
  const [dark, setDark] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.dataset.catalogTheme === 'dark')
    setHydrated(true)
  }, [])

  function toggleTheme() {
    const nextDark = !dark
    setDark(nextDark)
    document.documentElement.dataset.catalogTheme = nextDark ? 'dark' : 'light'
    try {
      localStorage.setItem(themeStorageKey, nextDark ? 'dark' : 'light')
    } catch {}
  }

  return (
    <div className="marketplace-shell" data-hydrated={hydrated}>
      <a className="catalog-skip-link" href="#catalog-content">
        Lewati ke konten
      </a>
      <header className="catalog-header">
        <div className="catalog-header-inner">
          {detail ? (
            <Link
              to="/catalog"
              search={{}}
              className="catalog-back"
              aria-label="Kembali ke katalog"
            >
              <img
                src="/images/catalog/back.svg"
                width="24"
                height="24"
                alt=""
              />
            </Link>
          ) : (
            <span className="catalog-icon" aria-hidden="true">
              <img
                className="catalog-light-icon"
                src="/images/catalog/box-icon.svg"
                width="24"
                height="24"
                alt=""
              />
              <img
                className="catalog-dark-icon"
                src="/images/catalog/box-icon-dark.svg"
                width="24"
                height="24"
                alt=""
              />
            </span>
          )}
          <span className="catalog-header-title">
            {detail ? 'Detail produk' : 'Kategori & pencarian'}
          </span>
          <Button
            variant="ghost"
            className="catalog-theme-toggle"
            onClick={toggleTheme}
            aria-pressed={dark}
            aria-label={dark ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
          >
            {dark ? 'Tema terang' : 'Tema gelap'}
          </Button>
        </div>
      </header>
      <main
        id="catalog-content"
        tabIndex={-1}
        className={`catalog-content${detail ? ' catalog-detail-content' : ''}`}
      >
        {children}
      </main>
      <footer className="catalog-footer">
        <Link to="/" className="catalog-home-link">
          DistribuHub · Beranda
        </Link>
        <span>Kemasan untuk kebutuhan usaha</span>
      </footer>
    </div>
  )
}

export function CatalogState({
  title,
  description,
  children,
  loading,
  onRetry,
}: {
  title: string
  description: string
  children?: ReactNode
  loading?: boolean
  onRetry?: () => void
}) {
  const router = useRouter()
  return (
    <section
      className="catalog-state"
      role={onRetry ? 'alert' : 'status'}
      aria-busy={loading}
    >
      {loading && <div className="catalog-loader" aria-hidden="true" />}
      <h1>{title}</h1>
      <p>{description}</p>
      {onRetry && (
        <Button
          className="catalog-button"
          onClick={async () => {
            await router.invalidate()
            onRetry()
          }}
        >
          Coba lagi
        </Button>
      )}
      {children}
    </section>
  )
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Link
      className="catalog-product-link"
      to="/catalog/$productId"
      params={{ productId: product.id }}
      aria-label={`Lihat ${product.name}`}
    >
      <Card className="catalog-product-card">
        {product.imageUrl ? (
          <img
            className="catalog-product-image"
            src={product.imageUrl}
            alt=""
            width="292"
            height="224"
            loading="lazy"
          />
        ) : (
          <div className="catalog-product-image catalog-image-empty">
            Foto belum tersedia
          </div>
        )}
        <span className="catalog-verified">✓ TERVERIFIKASI</span>
        <h2>{product.name}</h2>
        <p className="catalog-product-price">
          {formatRupiah(product.basePriceIdr)}
        </p>
        <p className="catalog-product-meta">
          / {product.unit} · MOQ {formatQuantity(product.moq)} {product.unit}
        </p>
        <p className="catalog-product-supplier">{product.supplier.name}</p>
        <div className="catalog-product-bottom">
          <span
            className={
              product.availableStock > 0
                ? 'catalog-available'
                : 'catalog-unavailable'
            }
          >
            {product.availableStock > 0 ? '● Tersedia' : 'Stok habis'}
          </span>
          <span className="catalog-detail-link">Lihat detail</span>
        </div>
      </Card>
    </Link>
  )
}

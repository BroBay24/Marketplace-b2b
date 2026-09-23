import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  CatalogShell,
  CatalogState,
  ProductCard,
} from '#/components/catalog/catalog-ui'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { catalogSearchSchema } from '#/domain/catalog'
import { listCatalog } from '#/server/catalog.functions'

export const Route = createFileRoute('/catalog')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, category: search.category }),
  loader: ({ deps }) => listCatalog({ data: deps }),
  head: () => ({ meta: [{ title: 'Katalog kemasan | DistribuHub' }] }),
  pendingComponent: () => (
    <CatalogShell>
      <CatalogState
        title="Memuat katalog…"
        description="Menyiapkan produk dan harga terbaru."
        loading
      />
    </CatalogShell>
  ),
  errorComponent: ({ reset }) => (
    <CatalogShell>
      <CatalogState
        title="Katalog belum dapat dimuat"
        description="Silakan coba lagi dalam beberapa saat."
        onRetry={reset}
      />
    </CatalogShell>
  ),
  component: CatalogPage,
})

function CatalogPage() {
  const { products, categories, hasVisibleProducts } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [sort, setSort] = useState('name')
  const sortedProducts = [...products].sort((a, b) =>
    sort === 'price-asc'
      ? a.basePriceIdr - b.basePriceIdr
      : sort === 'price-desc'
        ? b.basePriceIdr - a.basePriceIdr
        : a.name.localeCompare(b.name, 'id'),
  )

  return (
    <CatalogShell>
      <section className="catalog-intro" aria-labelledby="catalog-title">
        <p className="catalog-eyebrow">KATALOG GROSIR</p>
        <h1 id="catalog-title">Temukan kebutuhan bisnis</h1>
        <p className="catalog-description">
          Kemasan dari supplier terverifikasi, dengan harga sesuai jumlah
          pembelian.
        </p>
      </section>

      <form
        className="catalog-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          const q = String(
            new FormData(event.currentTarget).get('q') ?? '',
          ).trim()
          void navigate({ search: { ...search, q: q || undefined } })
        }}
      >
        <label className="catalog-search-field">
          <span className="sr-only">Cari produk atau SKU</span>
          <span className="catalog-icon" aria-hidden="true">
            <img
              className="catalog-light-icon"
              src="/images/catalog/search.svg"
              width="24"
              height="24"
              alt=""
            />
            <img
              className="catalog-dark-icon"
              src="/images/catalog/search-dark.svg"
              width="24"
              height="24"
              alt=""
            />
          </span>
          <Input
            key={search.q ?? ''}
            name="q"
            type="search"
            defaultValue={search.q ?? ''}
            placeholder="Cari produk atau SKU"
            maxLength={120}
            className="catalog-search-input"
          />
        </label>
        <Button type="submit" className="catalog-button">
          Cari
        </Button>
      </form>

      <nav className="catalog-categories" aria-label="Kategori produk">
        <Link
          to="/catalog"
          search={{ q: search.q }}
          className="catalog-category"
          aria-current={!search.category ? 'page' : undefined}
        >
          Semua
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            to="/catalog"
            search={{ q: search.q, category: category.slug }}
            className="catalog-category"
            aria-current={
              search.category === category.slug ? 'page' : undefined
            }
          >
            {category.name}
          </Link>
        ))}
      </nav>

      <div className="catalog-results-heading">
        <p role="status">
          {products.length} produk{search.q ? ` untuk “${search.q}”` : ''}
        </p>
        <label className="catalog-sort">
          <span className="sr-only">Urutkan produk</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="name">Nama produk</option>
            <option value="price-asc">Harga terendah</option>
            <option value="price-desc">Harga tertinggi</option>
          </select>
        </label>
      </div>

      {products.length ? (
        <div className="catalog-grid">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <CatalogState
          title={
            hasVisibleProducts
              ? 'Produk belum ditemukan'
              : 'Produk belum tersedia'
          }
          description={
            hasVisibleProducts
              ? 'Coba kata kunci lain atau lihat semua kategori.'
              : 'Belum ada produk aktif dari supplier terverifikasi.'
          }
        >
          {hasVisibleProducts && (
            <Button asChild className="catalog-button">
              <Link to="/catalog" search={{}}>
                Lihat semua produk
              </Link>
            </Button>
          )}
        </CatalogState>
      )}
    </CatalogShell>
  )
}

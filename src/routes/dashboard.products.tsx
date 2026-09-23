import { Link, createFileRoute } from '@tanstack/react-router'
import { ProductTable } from '#/components/products/product-table'
import { PageHeading } from '#/components/page-heading'
import { buttonVariants } from '#/components/ui/button'
import { listCatalog } from '#/server/catalog.functions'

export const Route = createFileRoute('/dashboard/products')({
  loader: () => listCatalog({ data: {} }),
  component: ProductsPage,
  pendingComponent: () => <p role="status">Memuat katalog…</p>,
  errorComponent: () => (
    <p role="alert">Katalog belum dapat dimuat. Silakan muat ulang halaman.</p>
  ),
})
function ProductsPage() {
  const { products } = Route.useLoaderData()
  return (
    <>
      <PageHeading
        title="Produk kemasan"
        description="Produk aktif dari pemasok terverifikasi."
      >
        <Link to="/catalog" className={buttonVariants({ variant: 'outline' })}>
          Buka katalog
        </Link>
      </PageHeading>
      <p className="text-sm text-muted-foreground">
        Pratinjau katalog publik. Pengelolaan produk tersedia setelah akses akun
        pemasok diaktifkan.
      </p>
      <ProductTable
        products={products.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category.name,
          unit: product.unit,
          price: product.basePriceIdr,
          stock: product.availableStock,
          status: 'active',
        }))}
      />
    </>
  )
}

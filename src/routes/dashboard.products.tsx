import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { products as initialProducts } from '#/data/products'
import { ProductTable } from '#/components/products/product-table'
import { ProductForm } from '#/components/products/product-form'
import { PageHeading } from '#/components/page-heading'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '#/components/ui/sheet'

export const Route = createFileRoute('/dashboard/products')({
  component: ProductsPage,
})
function ProductsPage() {
  const [products, setProducts] = useState(initialProducts)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  return (
    <>
      <PageHeading
        title="Manajemen produk"
        description="Kelola katalog, harga, dan ketersediaan produk distributor Anda."
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus size={16} />
              Tambah produk
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Tambah produk</SheetTitle>
              <SheetDescription>
                Lengkapi informasi produk baru.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              {open && (
                <ProductForm
                  existingSkus={products.map((p) => p.sku)}
                  onAdd={(product) => {
                    setProducts((current) => [...current, product])
                    setMessage(
                      `${product.name} berhasil ditambahkan ke data demo. Perubahan akan hilang saat meninggalkan atau memuat ulang halaman.`,
                    )
                    setOpen(false)
                  }}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </PageHeading>
      <p className="text-sm text-slate-500">
        Data demonstrasi · Belum terhubung ke API · Aksi edit belum tersedia
      </p>
      <p
        role="status"
        className="rounded-lg bg-emerald-50 text-sm text-emerald-900 empty:hidden [&:not(:empty)]:p-4"
      >
        {message}
      </p>
      <ProductTable products={products} />
    </>
  )
}

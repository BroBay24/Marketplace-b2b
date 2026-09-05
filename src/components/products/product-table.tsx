import { useMemo, useState } from 'react'
import { useTable } from '@tanstack/react-table'
import { Search } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableCaption,
} from '#/components/ui/table'
import { productColumns, productFeatures } from './product-columns'
import type { Product } from '#/data/products'

export function ProductTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('id-ID')
    return products.filter(
      (p) =>
        p.name.toLocaleLowerCase('id-ID').includes(term) ||
        p.sku.toLocaleLowerCase('id-ID').includes(term),
    )
  }, [products, search])
  const table = useTable({
    features: productFeatures,
    data: filtered,
    columns: productColumns,
    getRowId: (row) => row.id,
  })
  return (
    <section
      className="overflow-hidden rounded-xl border bg-white"
      aria-label="Daftar produk"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b p-5">
        <div>
          <h2 className="font-semibold">Semua produk</h2>
          <p role="status" className="mt-1 text-xs text-slate-500">
            {filtered.length} dari {products.length} produk
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Label htmlFor="product-search" className="mb-2">
            Cari nama atau SKU
          </Label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <Input
              id="product-search"
              className="pl-9"
              placeholder="Cari produk…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabel produk, geser untuk melihat semua kolom"
        className="overflow-x-auto"
      >
        <Table className="min-w-[900px]">
          <TableCaption className="pb-4">
            Harga per satuan produk · Data demonstrasi
          </TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    scope="col"
                    key={header.id}
                    className="bg-slate-50 px-5 py-4"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="px-5 py-5">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <p className="font-semibold">Produk tidak ditemukan</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Coba nama atau SKU lain, atau kosongkan pencarian.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

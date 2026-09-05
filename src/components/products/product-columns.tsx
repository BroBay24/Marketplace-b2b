import { createColumnHelper, tableFeatures } from '@tanstack/react-table'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { formatRupiah } from '#/lib/format'
import type { Product } from '#/data/products'

export const productFeatures = tableFeatures({})
const helper = createColumnHelper<typeof productFeatures, Product>()
export const productColumns = helper.columns([
  helper.accessor('sku', {
    header: 'SKU',
    cell: (info) => (
      <span className="font-mono text-xs text-slate-500">
        {info.getValue()}
      </span>
    ),
  }),
  helper.accessor('name', {
    header: 'Nama Produk',
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  helper.accessor('category', { header: 'Kategori' }),
  helper.accessor('unit', { header: 'Satuan' }),
  helper.accessor('price', {
    header: 'Harga',
    cell: (info) => formatRupiah(info.getValue()),
  }),
  helper.accessor('stock', { header: 'Stok' }),
  helper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <Badge variant={info.getValue() === 'active' ? 'secondary' : 'outline'}>
        {info.getValue() === 'active' ? 'Aktif' : 'Nonaktif'}
      </Badge>
    ),
  }),
  helper.display({
    id: 'actions',
    header: 'Aksi',
    cell: (info) => (
      <Button
        variant="ghost"
        size="sm"
        disabled
        aria-label={`Edit ${info.row.original.name} (segera tersedia)`}
      >
        Edit (demo)
      </Button>
    ),
  }),
])

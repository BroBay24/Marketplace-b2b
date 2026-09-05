import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type { Product, ProductStatus } from '#/data/products'

function errorText(errors: Array<string | { message: string } | undefined>) {
  return [
    ...new Set(
      errors.map((error) =>
        typeof error === 'string' ? error : error?.message,
      ),
    ),
  ]
    .filter(Boolean)
    .join(' ')
}

const schema = z.object({
  sku: z.string().trim().min(1, 'SKU wajib diisi.'),
  name: z.string().trim().min(1, 'Nama produk wajib diisi.'),
  category: z.string().trim().min(1, 'Kategori wajib diisi.'),
  unit: z.string().trim().min(1, 'Satuan wajib diisi.'),
  price: z.number().finite().positive('Harga harus lebih besar dari nol.'),
  stock: z.number().finite().min(0, 'Stok tidak boleh negatif.'),
  status: z.enum(['active', 'inactive'], { error: 'Pilih status yang valid.' }),
})
const textFields = [
  { name: 'sku', label: 'SKU', placeholder: 'MNM-004' },
  { name: 'name', label: 'Nama produk', placeholder: 'Nama produk' },
  { name: 'category', label: 'Kategori', placeholder: 'Minuman' },
  { name: 'unit', label: 'Satuan', placeholder: 'Karton' },
] as const
const numberFields = [
  { name: 'price', label: 'Harga (Rp)' },
  { name: 'stock', label: 'Stok' },
] as const
export function ProductForm({
  onAdd,
  existingSkus,
}: {
  onAdd: (product: Product) => void
  existingSkus: string[]
}) {
  const form = useForm({
    defaultValues: {
      sku: '',
      name: '',
      category: '',
      unit: '',
      price: 0,
      stock: 0,
      status: 'active' as ProductStatus,
    },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: ({ value }) => {
      onAdd({
        ...schema.parse(value),
        sku: value.sku.trim().toUpperCase(),
        id: crypto.randomUUID(),
      })
    },
  })
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-5"
    >
      <p className="text-sm leading-relaxed text-slate-500">
        Tambahkan produk untuk mencoba alur pengelolaan. Data hanya tersimpan
        selama halaman ini terbuka.
      </p>
      {textFields.map(({ name, label, placeholder }) => (
        <form.Field
          key={name}
          name={name}
          validators={
            name === 'sku'
              ? {
                  onChange: ({ value }) =>
                    existingSkus.some(
                      (sku) => sku.toUpperCase() === value.trim().toUpperCase(),
                    )
                      ? 'SKU sudah digunakan.'
                      : undefined,
                }
              : undefined
          }
        >
          {(field) => (
            <div>
              <Label htmlFor={`product-${name}`} className="mb-2">
                {label}
              </Label>
              <Input
                id={`product-${name}`}
                name={name}
                required
                placeholder={placeholder}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={`error-${name}`}
              />
              <p id={`error-${name}`} className="mt-1 text-xs text-red-700">
                {errorText(field.state.meta.errors)}
              </p>
            </div>
          )}
        </form.Field>
      ))}
      <div className="grid grid-cols-2 gap-4">
        {numberFields.map(({ name, label }) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <div>
                <Label htmlFor={`product-${name}`} className="mb-2">
                  {label}
                </Label>
                <Input
                  id={`product-${name}`}
                  name={name}
                  type="number"
                  min={name === 'price' ? '0.01' : '0'}
                  step="any"
                  required
                  value={
                    Number.isNaN(field.state.value) ? '' : field.state.value
                  }
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={`error-${name}`}
                />
                <p id={`error-${name}`} className="mt-1 text-xs text-red-700">
                  {errorText(field.state.meta.errors)}
                </p>
              </div>
            )}
          </form.Field>
        ))}
      </div>
      <form.Field name="status">
        {(field) => (
          <div>
            <Label htmlFor="product-status" className="mb-2">
              Status
            </Label>
            <select
              id="product-status"
              name="status"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'active' || value === 'inactive')
                  field.handleChange(value)
              }}
              className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        )}
      </form.Field>
      <Button type="submit" className="w-full">
        Tambahkan produk demo
      </Button>
    </form>
  )
}

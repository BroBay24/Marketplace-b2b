import { z } from 'zod'

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
})
export const catalogProductIdSchema = z.object({ id: z.uuid() })

export type CatalogCategory = { id: string; name: string; slug: string }
export type CatalogProduct = {
  id: string
  sku: string
  name: string
  description: string
  category: CatalogCategory
  supplier: { id: string; name: string; city: string }
  unit: string
  moq: number
  quantityStep: number
  basePriceIdr: number
  availableStock: number
  priceTiers: Array<{ minQuantity: number; unitPriceIdr: number }>
  imageUrl: string | null
}
export type CatalogResult = {
  products: Array<CatalogProduct>
  categories: Array<CatalogCategory>
  hasVisibleProducts: boolean
}

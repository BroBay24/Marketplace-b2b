import { z } from 'zod'

// PostgreSQL integer bounds keep the validation contract identical to storage.
const positiveInteger = z.number().int().positive().max(2_147_483_647)

export const priceTierInputSchema = z.object({
  minimumQuantity: positiveInteger,
  unitPriceIdr: positiveInteger,
})

export const pricingInputSchema = z
  .object({
    minimumOrderQuantity: positiveInteger,
    quantityStep: positiveInteger,
    basePriceIdr: positiveInteger,
    priceTiers: z.array(priceTierInputSchema).min(1).max(50),
  })
  .superRefine((value, context) => {
    if (value.minimumOrderQuantity % value.quantityStep !== 0) {
      context.addIssue({
        code: 'custom',
        path: ['minimumOrderQuantity'],
        message: 'MOQ harus merupakan kelipatan langkah kuantitas.',
      })
    }
    const sortedTiers = [...value.priceTiers].sort(
      (a, b) => a.minimumQuantity - b.minimumQuantity,
    )
    if (
      sortedTiers.length > 0 &&
      (sortedTiers[0].minimumQuantity !== value.minimumOrderQuantity ||
        sortedTiers[0].unitPriceIdr !== value.basePriceIdr)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['priceTiers'],
        message: 'Tier pertama harus dimulai dari MOQ dengan harga dasar.',
      })
    }
    const thresholds = new Set<number>()
    let previousPrice = value.basePriceIdr
    for (const tier of sortedTiers) {
      if (
        thresholds.has(tier.minimumQuantity) ||
        tier.minimumQuantity < value.minimumOrderQuantity
      ) {
        context.addIssue({
          code: 'custom',
          path: ['priceTiers'],
          message: 'Batas tier harus unik dan tidak boleh di bawah MOQ.',
        })
      }
      if (tier.unitPriceIdr > previousPrice) {
        context.addIssue({
          code: 'custom',
          path: ['priceTiers'],
          message:
            'Harga satuan tidak boleh naik pada tier kuantitas yang lebih tinggi.',
        })
      }
      thresholds.add(tier.minimumQuantity)
      previousPrice = tier.unitPriceIdr
    }
  })

export const productInputSchema = pricingInputSchema.safeExtend({
  supplierCompanyId: z.uuid(),
  categoryId: z.uuid(),
  sku: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{1,64}$/),
  slug: z
    .string()
    .trim()
    .max(160)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().trim().min(5).max(140),
  description: z.string().trim().min(1).max(4000),
  unit: z.literal('pcs'),
  currency: z.literal('IDR').default('IDR'),
})

export const inventoryInputSchema = z
  .object({
    onHand: z.number().int().min(0).max(2_147_483_647),
    reserved: z.number().int().min(0).max(2_147_483_647),
  })
  .refine((value) => value.reserved <= value.onHand, {
    path: ['reserved'],
    message: 'Stok dipesan tidak boleh melebihi stok fisik.',
  })

export type ProductPricing = z.infer<typeof pricingInputSchema>

/** All-units pricing: one tier price applies to every unit in this SKU line. */
export function calculateProductPrice(input: ProductPricing, quantity: number) {
  const product = pricingInputSchema.parse(input)
  const validQuantity = positiveInteger.parse(quantity)
  if (
    validQuantity < product.minimumOrderQuantity ||
    validQuantity % product.quantityStep !== 0
  ) {
    throw new RangeError(
      'Kuantitas harus memenuhi MOQ dan kelipatan langkah kuantitas.',
    )
  }
  const tier = [...product.priceTiers]
    .sort((a, b) => b.minimumQuantity - a.minimumQuantity)
    .find((item) => validQuantity >= item.minimumQuantity)
  const unitPriceIdr = tier?.unitPriceIdr ?? product.basePriceIdr
  const subtotalIdr = unitPriceIdr * validQuantity
  if (!Number.isSafeInteger(subtotalIdr)) {
    throw new RangeError('Subtotal melebihi batas bilangan bulat yang aman.')
  }
  return {
    quantity: validQuantity,
    unitPriceIdr,
    subtotalIdr,
    currency: 'IDR' as const,
  }
}

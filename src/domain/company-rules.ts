import { z } from 'zod'

export const companyInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  responsiblePerson: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1_000).optional(),
  kind: z.enum(['buyer', 'supplier']),
  status: z.enum(['active', 'suspended']).default('active'),
  city: z.string().trim().min(1).max(100),
})

export const addressInputSchema = z.object({
  companyId: z.uuid(),
  label: z.string().trim().min(2).max(40),
  recipientName: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[+]?[0-9]{8,15}$/),
  street: z.string().trim().min(10).max(250),
  city: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(100),
  postalCode: z.string().regex(/^[0-9]{5}$/),
  isDefault: z.boolean().default(false),
})

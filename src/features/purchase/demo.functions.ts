import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { enterDemo, mutateDemo, readDemo } from './demo.server'

const id = z.string().min(1).max(80)
const command = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cart'),
    productId: id,
    quantity: z.number().int().min(0).max(100000),
  }),
  z.object({
    type: z.literal('checkout'),
    expectedTotal: z.number().int().nonnegative(),
    address: z.object({
      recipient: z.string().max(100),
      phone: z.string().max(30),
      street: z.string().max(300),
      city: z.string().max(100),
    }),
  }),
  z.object({
    type: z.literal('payment'),
    purchaseId: id,
    result: z.enum(['pending', 'failed', 'expired', 'review', 'paid']),
    amount: z.number().int().nonnegative().optional(),
  }),
  z.object({ type: z.literal('retry'), purchaseId: id }),
  z.object({
    type: z.literal('fulfill'),
    purchaseId: id,
    orderId: id,
    next: z.enum(['ready', 'processing', 'shipped', 'completed']),
    tracking: z.string().max(100).optional(),
  }),
  z.object({
    type: z.literal('report'),
    purchaseId: id,
    orderId: id,
    message: z.string().max(1000),
  }),
  z.object({
    type: z.literal('resolve'),
    purchaseId: id,
    orderId: id,
    note: z.string().max(1000),
  }),
])
export const getDemo = createServerFn({ method: 'GET' }).handler(() =>
  readDemo(),
)
export const startDemo = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      actor: z.enum(['buyer', 'supplier-a', 'supplier-b', 'admin']),
      reset: z.boolean().default(false),
    }),
  )
  .handler(({ data }) => enterDemo(data.actor, data.reset))
export const runDemoCommand = createServerFn({ method: 'POST' })
  .validator(z.object({ requestId: z.uuid(), command }))
  .handler(({ data }) => mutateDemo(data.requestId, data.command))

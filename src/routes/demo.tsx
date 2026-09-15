import { createFileRoute } from '@tanstack/react-router'
import { getDemo } from '#/features/purchase/demo.functions'
import { PurchaseDemo } from '#/features/purchase/purchase-demo'

export const Route = createFileRoute('/demo')({
  loader: () => getDemo(),
  component: () => <PurchaseDemo initial={Route.useLoaderData()} />,
})

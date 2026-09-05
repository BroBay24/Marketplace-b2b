import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/placeholder-page'

export const Route = createFileRoute('/dashboard/inventory')({
  component: () => (
    <PlaceholderPage
      title="Persediaan"
      description="Pantau stok dan rencanakan pengadaan produk."
    />
  ),
})

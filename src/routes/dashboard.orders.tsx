import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/placeholder-page'

export const Route = createFileRoute('/dashboard/orders')({
  component: () => (
    <PlaceholderPage
      title="Pesanan"
      description="Kelola alur pesanan dari toko mitra Anda."
    />
  ),
})

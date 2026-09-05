import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '#/components/placeholder-page'

export const Route = createFileRoute('/dashboard/customers')({
  component: () => (
    <PlaceholderPage
      title="Pelanggan"
      description="Bangun hubungan yang baik dengan toko mitra."
    />
  ),
})
